// 규칙 기반 별명·한 줄 소개 생성기 (Rule_Based_Generator)
// 설계 문서 "규칙 기반 별명·한 줄 소개 생성기" 섹션 기준.
//
// 리뷰 텍스트에서 사전 정의 키워드를 탐색하고, 카테고리·지역·가격대와
// 조합하여 게임용 별명(survivalTitle, 6~18자)과 한 줄 소개(survivalSummary)를
// 생성한다. 특징을 판단할 정보가 부족하면 fallback을 사용한다.
//
// 사실 왜곡 금지: 존재하지 않는 메뉴/서비스/시설/셰프/수상 기록을 생성하지
// 않고, "서울 최고", "미슐랭급" 같은 사실 확인 어려운 최상급 표현을 쓰지 않는다.
// 별명·한 줄 소개는 리뷰에서 실제로 관찰된 키워드에만 근거한다.
//
// _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
import type { RestaurantReview } from '../types';

export interface GeneratorInput {
  category?: string;
  region: string;
  priceLevel?: number;
  reviews: RestaurantReview[];
}

export interface GeneratedText {
  survivalTitle: string; // 6~18자
  survivalSummary: string; // 한 문장
}

// 별명 길이 규칙 (Requirement 5.3)
const TITLE_MIN = 6;
const TITLE_MAX = 18;

// 정보 부족 시 사용하는 fallback (Requirement 5.5)
const FALLBACK_TITLE = '오늘의 도전자'; // 6자 (공백 포함, 6~18 범위)
const FALLBACK_SUMMARY = '현재 검색 조건에 맞는 식당 후보입니다.';

/**
 * 키워드 정의.
 *
 * 각 키워드는 리뷰 텍스트에서 탐색할 여러 표현(match)과, 별명/소개 조합에
 * 사용할 짧은 라벨(label), 소개 문장에 쓰일 특징 구절(phrase)을 가진다.
 * 모든 표현은 리뷰에서 관찰 가능한 일반적 특징만 나타내며, 특정 메뉴·시설·
 * 수상 등 사실 확인이 필요한 정보나 최상급 표현을 포함하지 않는다.
 */
interface Keyword {
  key: string;
  match: string[];
  label: string; // 별명 조합용 (짧음)
  phrase: string; // 한 줄 소개 조합용
}

const KEYWORDS: Keyword[] = [
  { key: 'mood', match: ['분위기', '무드', '인테리어', '감성'], label: '분위기', phrase: '분위기가 좋다는' },
  { key: 'date', match: ['데이트', '기념일', '커플'], label: '데이트', phrase: '데이트하기 좋다는' },
  { key: 'value', match: ['가성비', '가심비', '저렴', '합리적'], label: '가성비', phrase: '가성비가 좋다는' },
  { key: 'kind', match: ['친절', '서비스가 좋', '응대'], label: '친절', phrase: '친절하다는' },
  { key: 'wait', match: ['웨이팅', '대기', '줄서', '줄 서'], label: '웨이팅', phrase: '웨이팅이 있다는' },
  { key: 'wine', match: ['와인', '샴페인', '하이볼', '칵테일'], label: '와인', phrase: '와인이 어울린다는' },
  { key: 'pasta', match: ['파스타', '스파게티'], label: '파스타', phrase: '파스타가 좋다는' },
  { key: 'dessert', match: ['디저트', '케이크', '디져트', '베이커리'], label: '디저트', phrase: '디저트가 좋다는' },
  { key: 'view', match: ['뷰', '전망', '경치', '야경'], label: '뷰', phrase: '뷰가 좋다는' },
  { key: 'quiet', match: ['조용', '한적', '차분'], label: '조용', phrase: '조용하다는' },
  { key: 'fresh', match: ['신선', '재료가 좋', '싱싱'], label: '신선함', phrase: '재료가 신선하다는' },
  { key: 'cozy', match: ['아늑', '아기자기', '편안'], label: '아늑함', phrase: '아늑하다는' },
];

// 가격대 라벨 (Google Places priceLevel 0~4 기준, 없으면 undefined)
function priceLabel(priceLevel?: number): string | undefined {
  if (priceLevel === undefined) return undefined;
  if (priceLevel <= 1) return '가성비';
  if (priceLevel === 2) return '데일리';
  if (priceLevel === 3) return '프리미엄';
  return '스페셜';
}

/**
 * 리뷰 텍스트에서 사전 정의 키워드를 탐색한다.
 * 등장 순서(KEYWORDS 정의 순서)를 유지하여 결정적 결과를 보장한다.
 */
function detectKeywords(reviews: RestaurantReview[]): Keyword[] {
  const corpus = reviews
    .map((r) => (r.text ?? ''))
    .join(' ')
    .toLowerCase();
  if (corpus.trim().length === 0) return [];
  return KEYWORDS.filter((kw) =>
    kw.match.some((m) => corpus.includes(m.toLowerCase())),
  );
}

/**
 * 문자열 길이가 6~18자 범위에 들도록 보정한다.
 * - 18자 초과: 잘라낸다.
 * - 6자 미만: 접미 라벨을 덧붙여 최소 길이를 채운다.
 * fallback 경로를 포함해 어떤 출력도 항상 6~18자를 만족하도록 하는 안전장치.
 */
function clampTitle(raw: string): string {
  let title = raw.trim();
  if (title.length > TITLE_MAX) {
    title = title.slice(0, TITLE_MAX).trim();
  }
  // 자르는 과정에서 다시 짧아졌을 수 있으므로 최소 길이 보정을 이후에 수행한다.
  const PAD = ' 서바이버'; // 5자, 붙이면 게임용 별명 톤 유지
  while (title.length < TITLE_MIN) {
    title = (title + PAD).trim();
    if (title.length > TITLE_MAX) {
      title = title.slice(0, TITLE_MAX).trim();
      break;
    }
  }
  // 마지막 방어: 여전히 범위를 벗어나면 fallback으로 대체.
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return FALLBACK_TITLE;
  }
  return title;
}

/**
 * 별명(survivalTitle)을 생성한다.
 * 지역 + (키워드 라벨 또는 가격대 라벨 또는 카테고리) 조합을 우선 사용하고,
 * 조합 결과를 clampTitle으로 6~18자 범위에 맞춘다.
 */
function buildTitle(
  input: GeneratorInput,
  keywords: Keyword[],
): string {
  const region = input.region.trim();
  const priceLbl = priceLabel(input.priceLevel);
  const category = input.category?.trim();

  // 별명에 사용할 특징 라벨 후보(우선순위: 리뷰 키워드 > 가격대 > 카테고리).
  const featureLabels: string[] = [];
  for (const kw of keywords) featureLabels.push(kw.label);
  if (priceLbl) featureLabels.push(priceLbl);
  if (category) featureLabels.push(category);

  // 특징이 전혀 없고 지역만 있는 경우: 지역 기반 최소 별명.
  if (featureLabels.length === 0) {
    if (region.length === 0) return FALLBACK_TITLE;
    // 예: "성수 도전자" → clamp로 6자 이상 보정.
    return clampTitle(`${region} 도전자`);
  }

  const primary = featureLabels[0];
  const secondary = featureLabels[1];

  // 지역이 있으면 "지역 + 특징 + 접미" 형태, 없으면 특징 중심.
  // 접미어는 게임용 톤을 유지하며 사실을 주장하지 않는다("맛집" 등 단정 회피).
  const suffixes = ['도전자', '한 접시', '후보'];

  let candidate: string;
  if (region.length > 0) {
    candidate = `${region} ${primary} ${suffixes[0]}`;
  } else {
    candidate = `${primary} ${suffixes[0]}`;
  }

  // 아직 짧으면 2차 특징을 끼워 넣어 자연스럽게 길이를 늘린다.
  if (candidate.length < TITLE_MIN && secondary) {
    candidate =
      region.length > 0
        ? `${region} ${primary} ${secondary} ${suffixes[0]}`
        : `${primary} ${secondary} ${suffixes[0]}`;
  }

  return clampTitle(candidate);
}

/**
 * 한 줄 소개(survivalSummary)를 생성한다.
 * 리뷰에서 관찰된 특징 구절을 최대 2개까지 조합한다. 특징이 없으면
 * 지역·카테고리·가격대만으로 사실 왜곡 없는 소개를 만들고, 그마저 부족하면
 * fallback을 사용한다.
 */
function buildSummary(
  input: GeneratorInput,
  keywords: Keyword[],
): string {
  const region = input.region.trim();
  const category = input.category?.trim();
  const priceLbl = priceLabel(input.priceLevel);

  // 위치/카테고리 도입부. "성수의 이탈리안", "성수의 식당" 등.
  const place = region.length > 0 ? `${region}의` : '';
  const kind = category && category.length > 0 ? category : '식당';
  const intro = place.length > 0 ? `${place} ${kind}` : kind;

  // 리뷰 특징 구절(관찰된 키워드에만 근거).
  const phrases = keywords.slice(0, 2).map((kw) => kw.phrase);

  if (phrases.length > 0) {
    // 예: "성수의 이탈리안. 리뷰에서 분위기가 좋다는, 파스타가 좋다는 평이 보이는 후보입니다."
    const joined = phrases.join(', ');
    return `${intro}. 리뷰에서 ${joined} 평이 보이는 후보입니다.`;
  }

  // 특징 키워드는 없지만 카테고리/가격대 정보가 있으면 사실만 담은 소개.
  if ((category && category.length > 0) || priceLbl) {
    const pricePart = priceLbl ? ` ${priceLbl} 가격대의` : '';
    return `${intro}로,${pricePart} 현재 검색 조건에 맞는 후보입니다.`.replace(
      ',,',
      ',',
    );
  }

  // 지역만 있는 경우.
  if (region.length > 0) {
    return `${region}에서 현재 검색 조건에 맞는 식당 후보입니다.`;
  }

  // 정보가 전혀 없으면 fallback.
  return FALLBACK_SUMMARY;
}

/**
 * 규칙 기반으로 게임용 별명과 한 줄 소개를 생성한다.
 *
 * - 별명(survivalTitle)은 항상 6~18자를 만족한다(fallback 포함).
 * - 리뷰에서 관찰된 키워드, 카테고리, 지역, 가격대만 사용한다.
 * - 존재하지 않는 메뉴/서비스/시설/셰프/수상 기록이나 최상급 표현을 만들지 않는다.
 * - 특징 판단 정보가 부족하면 fallback을 사용한다.
 *
 * _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
 */
export function generateSurvivalText(input: GeneratorInput): GeneratedText {
  const keywords = detectKeywords(input.reviews ?? []);

  const survivalTitle = buildTitle(input, keywords);
  const survivalSummary = buildSummary(input, keywords);

  return { survivalTitle, survivalSummary };
}
