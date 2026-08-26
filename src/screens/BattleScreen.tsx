import type { Restaurant } from '../types';
import RestaurantCard from '../components/RestaurantCard';
import VersusIndicator from '../components/VersusIndicator';
import RoundIndicator from '../components/RoundIndicator';
import styles from './BattleScreen.module.css';

interface BattleScreenProps {
  champion: Restaurant;
  challenger: Restaurant;
  round: number;
  totalRounds: number;
  onSelect: (id: string) => void;
  /** 게임을 중단하고 시작 화면(setup)으로 돌아간다. */
  onQuit?: () => void;
}

/**
 * BATTLE 화면 (Game_Status = 'playing').
 *
 * 두 식당(챔피언 vs 도전자)을 1:1로 비교하며 사용자가 하나를 선택한다.
 * - 별명·이미지·식당명·카테고리·위치·가격대·한 줄 소개·대표 리뷰는 RestaurantCard가 표시한다.
 * - 평점은 렌더링하지 않는다: RestaurantCard에 showRating={false}를 넘겨 평점 영역
 *   자체를 DOM에서 제외한다(CSS 숨김 아님). Requirements 8.2, 8.3.
 * - 각 카드는 선택 버튼을 가지며 클릭 시 onSelect(restaurant.id)를 호출한다. Requirement 8.4.
 * - RoundIndicator에 현재/전체 라운드(동적 값)를 표시한다. Requirements 7.3.
 *
 * 레이아웃: PC는 champion | VS | challenger 좌우 배치(반응형 폴리시는 task 10.2).
 * Requirements 7.3, 8.1, 8.2, 8.3, 8.4.
 */
function BattleScreen({
  champion,
  challenger,
  round,
  totalRounds,
  onSelect,
  onQuit,
}: BattleScreenProps) {
  return (
    <section className={styles.stage}>
      <header className={styles.header}>
        {onQuit && (
          <button
            type="button"
            className={styles.quitButton}
            onClick={onQuit}
          >
            ← 메인으로
          </button>
        )}
        <RoundIndicator current={round} total={totalRounds} />
      </header>

      <div className={styles.arena}>
        <div className={styles.side}>
          <RestaurantCard restaurant={champion} showRating={false} />
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => onSelect(champion.id)}
          >
            이 식당 선택
          </button>
        </div>

        <div className={styles.versus}>
          <VersusIndicator />
        </div>

        <div className={styles.side}>
          <RestaurantCard restaurant={challenger} showRating={false} />
          <button
            type="button"
            className={styles.selectButton}
            onClick={() => onSelect(challenger.id)}
          >
            이 식당 선택
          </button>
        </div>
      </div>
    </section>
  );
}

export default BattleScreen;
