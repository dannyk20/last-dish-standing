import { useCallback, useEffect, useState } from 'react';
import type { Restaurant } from '../types';
import PhotoWithFallback from '../components/PhotoWithFallback';
import PriceLevel from '../components/PriceLevel';
import RestaurantCard from '../components/RestaurantCard';
import styles from './WinnerScreen.module.css';

interface WinnerScreenProps {
  winner: Restaurant;
  /** 탈락한 식당들(등장/탈락 순서). 후면 3D 캐러셀에서 확인한다. */
  eliminated?: Restaurant[];
  winStreak: number;
  winCount: number;
  totalRounds: number;
  onRestartSame: () => void;
  onRestartNew: () => void;
}

/**
 * FINAL WINNER 화면 (Game_Status: finished).
 *
 * 두 가지 표시 모드를 가진다.
 * - 'front'(기본): 최종 WINNER 카드를 중앙 전면에 크게 보여주고, 그 뒤로 탈락 식당들이
 *   원근감(3D perspective) 있게 흐릿하게 깔린다. 이 후면 영역을 클릭하면 'back' 으로 전환된다.
 * - 'back': 탈락 식당들을 3D 캐러셀로 앞세워 좌우로 넘겨보며 확인한다. "우승한 식당 확인하기"
 *   버튼을 누르면 다시 'front' 로 돌아와 우승자를 전면 배치한다.
 *
 * WINNER 정보: 대표 사진, 별명, 식당명, 카테고리, 위치, 평점+리뷰 수, 가격대, 한 줄 소개,
 * 연승, 승리 횟수, 전체 라운드, Google Maps 링크. (Requirements 14.1, 14.2, 14.3, 16.6)
 * Winner/Champion 테마이므로 GOLD를 최대한 활용한다.
 */

type ViewMode = 'front' | 'back';

/** 최종 우승 식당의 상세 카드(전면에서 크게 표시). */
function WinnerCard({
  winner,
  winStreak,
  winCount,
  totalRounds,
}: {
  winner: Restaurant;
  winStreak: number;
  winCount: number;
  totalRounds: number;
}) {
  const {
    name,
    category,
    address,
    photoUrl,
    photoUrls,
    priceLevel,
    rating,
    userRatingCount,
    survivalTitle,
    survivalSummary,
    googleMapsUrl,
  } = winner;

  return (
    <article className={styles.card}>
      <p className={styles.survivalTitle}>{survivalTitle}</p>

      <div className={styles.photo}>
        <PhotoWithFallback
          photoUrl={photoUrl}
          photoUrls={photoUrls}
          alt={`${name} 대표 이미지`}
        />
      </div>

      <div className={styles.body}>
        <h2 className={styles.name}>{name}</h2>

        <div className={styles.meta}>
          {category && <span className={styles.category}>{category}</span>}
          {address && <span className={styles.address}>{address}</span>}
        </div>

        <div className={styles.priceRating}>
          <PriceLevel priceLevel={priceLevel} />
          <span className={styles.ratingArea}>
            {rating === undefined ? (
              <span className={styles.ratingNone}>평점 정보 없음</span>
            ) : (
              <>
                <span className={styles.ratingValue}>★ {rating.toFixed(1)}</span>
                {userRatingCount !== undefined && (
                  <span className={styles.ratingCount}>
                    리뷰 {userRatingCount.toLocaleString()}개
                  </span>
                )}
              </>
            )}
          </span>
        </div>

        <p className={styles.summary}>{survivalSummary}</p>

        <dl className={styles.stats}>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>연승</dt>
            <dd className={styles.statValue}>{winStreak}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>승리 횟수</dt>
            <dd className={styles.statValue}>{winCount}</dd>
          </div>
          <div className={styles.stat}>
            <dt className={styles.statLabel}>전체 라운드</dt>
            <dd className={styles.statValue}>{totalRounds}</dd>
          </div>
        </dl>

        {googleMapsUrl && (
          <a
            className={styles.mapLink}
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Maps에서 보기
          </a>
        )}
      </div>
    </article>
  );
}

/**
 * 탈락 식당 3D 캐러셀. 현재 항목을 중앙에, 좌우 항목을 원근감 있게 배치한다.
 * (translateZ/rotateY 기반 3D 변환 — 심도감을 준다.)
 */
function EliminatedCarousel({
  items,
  index,
  onPrev,
  onNext,
  onSelectIndex,
}: {
  items: Restaurant[];
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onSelectIndex: (i: number) => void;
}) {
  return (
    <div className={styles.carousel}>
      <div className={styles.carouselViewport}>
        <div className={styles.carouselScene}>
          {items.map((r, i) => {
            // 현재 인덱스 기준 상대 위치(-2..+2 범위만 표시, 나머지는 숨김).
            const offset = i - index;
            const abs = Math.abs(offset);
            if (abs > 2) return null;
            const isCenter = offset === 0;
            return (
              <div
                key={r.id}
                className={styles.carouselItem}
                style={
                  {
                    '--offset': offset,
                    '--abs': abs,
                    zIndex: 10 - abs,
                  } as React.CSSProperties
                }
                aria-hidden={!isCenter}
                onClick={() => {
                  if (!isCenter) onSelectIndex(i);
                }}
              >
                {/* 게임 중 사용한 카드와 동일하게 전체 정보를 표시하고,
                    게임 중엔 감췄던 평점까지 공개한다(showRating).
                    사진은 내부 슬라이드(좌우 넘김)만 남기고 썸네일 미리보기는 숨긴다. */}
                <RestaurantCard restaurant={r} showRating showPhotoThumbnails={false} />
              </div>
            );
          })}
        </div>
      </div>

      {items.length > 1 && (
        <div className={styles.carouselNav}>
          <button
            type="button"
            className={styles.carouselNavButton}
            onClick={onPrev}
            aria-label="이전 탈락 식당"
          >
            ‹
          </button>
          <span className={styles.carouselCounter} aria-live="polite">
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            className={styles.carouselNavButton}
            onClick={onNext}
            aria-label="다음 탈락 식당"
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}

function WinnerScreen({
  winner,
  eliminated = [],
  winStreak,
  winCount,
  totalRounds,
  onRestartSame,
  onRestartNew,
}: WinnerScreenProps) {
  const { name, survivalTitle, googleMapsUrl } = winner;

  // 표시 모드: 우승자 전면(front) / 탈락 식당 캐러셀 전면(back).
  const [view, setView] = useState<ViewMode>('front');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const hasEliminated = eliminated.length > 0;

  // 공유 상태: idle | copied(링크 복사 완료) | shared(네이티브 공유 완료) | error
  const [shareState, setShareState] = useState<
    'idle' | 'copied' | 'shared' | 'error'
  >('idle');

  const shareUrl =
    googleMapsUrl ??
    (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = 'LAST DISH STANDING';
  const shareText = `오늘의 우승 식당: ${name} (${survivalTitle})`;

  const handleShare = useCallback(async () => {
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    ) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl || undefined,
        });
        setShareState('shared');
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
      }
    }

    const toCopy = shareUrl || `${shareText}`;
    try {
      if (
        typeof navigator !== 'undefined' &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === 'function'
      ) {
        await navigator.clipboard.writeText(toCopy);
        setShareState('copied');
        window.setTimeout(() => setShareState('idle'), 2000);
        return;
      }
      setShareState('error');
    } catch {
      setShareState('error');
    }
  }, [shareTitle, shareText, shareUrl]);

  const shareLabel =
    shareState === 'copied'
      ? '링크가 복사되었습니다'
      : shareState === 'shared'
        ? '공유되었습니다'
        : shareState === 'error'
          ? '복사에 실패했습니다'
          : '결과 공유하기';

  const clampIndex = useCallback(
    (i: number) => (i + eliminated.length) % Math.max(1, eliminated.length),
    [eliminated.length],
  );
  const goPrev = useCallback(
    () => setCarouselIndex((i) => clampIndex(i - 1)),
    [clampIndex],
  );
  const goNext = useCallback(
    () => setCarouselIndex((i) => clampIndex(i + 1)),
    [clampIndex],
  );

  // 후면(back) 모드에서 좌우 화살표 키로 캐러셀을 넘길 수 있게 한다.
  useEffect(() => {
    if (view !== 'back') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Escape') setView('front');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, goPrev, goNext]);

  const showBackground = () => {
    if (!hasEliminated) return;
    setCarouselIndex(0);
    setView('back');
  };

  return (
    <main
      className={`${styles.screen} ${view === 'back' ? styles.screenBack : ''}`}
      data-view={view}
    >
      <header className={styles.header}>
        <p className={styles.eyebrow}>
          {view === 'front' ? 'FINAL WINNER' : 'ELIMINATED'}
        </p>
        <h1 className={styles.crown}>
          <span className={styles.crownIcon} aria-hidden="true">
            {view === 'front' ? '👑' : '🍽'}
          </span>
          {view === 'front' ? 'LAST DISH STANDING' : '탈락한 도전자들'}
        </h1>
      </header>

      {/* 무대: 우승자 중앙 전면 + 좌우 뒤편에 부채꼴로 음영진 탈락자들 */}
      <div className={styles.stage3d} data-view={view}>
        {/*
          전면 모드에서만 보이는 후면 탈락자 배경(우승자 좌우 뒤편 부채꼴 배치).
          영역 전체가 클릭 대상이며, 호버 시 살짝 앞으로 나와 전환 가능함을 암시한다.
          클릭하면 후면(캐러셀) 모드로 전환된다.
        */}
        {hasEliminated && view === 'front' && (
          <button
            type="button"
            className={styles.backdrop}
            onClick={showBackground}
            aria-label={`탈락한 식당 ${eliminated.length}곳 확인하기`}
          >
            {eliminated.slice(0, 6).map((r, i, arr) => {
              // 가운데(우승자)를 기준으로 좌우 대칭으로 나눠 배치한다.
              // half=한쪽 개수. 좌측은 음수 슬롯, 우측은 양수 슬롯을 갖는다.
              const half = Math.ceil(arr.length / 2);
              const isLeft = i < half;
              // 바깥쪽일수록 슬롯 절댓값이 커진다(우승자에서 멀어짐).
              const slot = isLeft ? -(half - i) : i - half + 1;
              return (
                <span
                  key={r.id}
                  className={styles.backdropCard}
                  style={
                    { '--slot': slot, '--abs': Math.abs(slot) } as React.CSSProperties
                  }
                  aria-hidden="true"
                >
                  {r.photoUrl ? (
                    <img
                      src={r.photoUrl}
                      alt=""
                      className={styles.backdropImg}
                      loading="lazy"
                    />
                  ) : (
                    <span className={styles.backdropFallback}>🍽</span>
                  )}
                </span>
              );
            })}
            <span className={styles.backdropHint}>
              탈락한 식당 {eliminated.length}곳 보기 →
            </span>
          </button>
        )}

        {/* 우승자 전면 레이어. 후면 모드에서는 위로 올라가며 사라진다. */}
        <div className={styles.winnerLayer} data-active={view === 'front'}>
          <WinnerCard
            winner={winner}
            winStreak={winStreak}
            winCount={winCount}
            totalRounds={totalRounds}
          />
        </div>

        {/* 후면 모드: 탈락자 캐러셀만 표시된다. */}
        {hasEliminated && view === 'back' && (
          <div className={styles.carouselLayer}>
            <EliminatedCarousel
              items={eliminated}
              index={carouselIndex}
              onPrev={goPrev}
              onNext={goNext}
              onSelectIndex={(i) => setCarouselIndex(i)}
            />
          </div>
        )}
      </div>

      {view === 'back' ? (
        <button
          type="button"
          className={styles.backToWinnerButton}
          onClick={() => setView('front')}
        >
          우승자 다시 확인하기
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.shareButton}
            onClick={handleShare}
            aria-live="polite"
          >
            <span className={styles.shareIcon} aria-hidden="true">
              🔗
            </span>
            {shareLabel}
          </button>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={onRestartSame}
            >
              같은 조건으로 다시하기
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onRestartNew}
            >
              새 게임 시작
            </button>
          </div>
        </>
      )}
    </main>
  );
}

export default WinnerScreen;
