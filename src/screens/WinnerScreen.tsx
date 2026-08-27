import { useCallback, useState } from 'react';
import type { Restaurant } from '../types';
import PhotoWithFallback from '../components/PhotoWithFallback';
import PriceLevel from '../components/PriceLevel';
import styles from './WinnerScreen.module.css';

interface WinnerScreenProps {
  winner: Restaurant;
  winStreak: number;
  winCount: number;
  totalRounds: number;
  onRestartSame: () => void;
  onRestartNew: () => void;
}

/**
 * FINAL WINNER 화면 (Game_Status: finished).
 *
 * 마지막까지 살아남은 최종 WINNER의 전체 정보를 표시한다.
 * - 대표 사진(PhotoWithFallback), 별명(survivalTitle), 식당명, 카테고리, 위치(주소),
 *   평점(rating) + 리뷰 수(userRatingCount), 가격대(PriceLevel), 한 줄 소개(survivalSummary),
 *   연승(winStreak), 승리 횟수(winCount), 전체 대결 라운드(totalRounds)를 표시한다. (Requirement 14.2)
 * - 평점이 없으면 "평점 정보 없음"을 표시한다. (Requirement 16.6)
 * - Google Maps 링크를 제공한다(googleMapsUrl이 있을 때만 렌더링, 새 탭 + rel=noopener noreferrer). (Requirement 14.3)
 *
 * Winner/Champion 테마이므로 GOLD를 최대한 활용한다.
 *
 * RESTART_SAME / RESTART_NEW 버튼을 콜백에 연결하여 노출한다(전체 와이어링은 task 10.3).
 *
 * Requirements 14.1, 14.2, 14.3.
 */
function WinnerScreen({
  winner,
  winStreak,
  winCount,
  totalRounds,
  onRestartSame,
  onRestartNew,
}: WinnerScreenProps) {
  const {
    name,
    category,
    address,
    photoUrl,
    priceLevel,
    rating,
    userRatingCount,
    survivalTitle,
    survivalSummary,
    googleMapsUrl,
  } = winner;

  // 공유 상태: idle | copied(링크 복사 완료) | shared(네이티브 공유 완료) | error
  const [shareState, setShareState] = useState<
    'idle' | 'copied' | 'shared' | 'error'
  >('idle');

  // 공유 문구와 링크를 구성한다. Google Maps 링크가 있으면 그것을, 없으면 현재
  // 페이지 URL을 공유 대상으로 사용한다.
  const shareUrl =
    googleMapsUrl ??
    (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = 'LAST DISH STANDING';
  const shareText = `오늘의 우승 식당: ${name} (${survivalTitle})`;

  const handleShare = useCallback(async () => {
    // 1) Web Share API 지원 시 네이티브 공유 시트를 연다(모바일 등).
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
        // 사용자가 공유 시트를 취소하면 AbortError 가 발생한다. 이 경우 조용히 무시한다.
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        // 그 외 오류는 클립보드 복사로 폴백한다(아래로 진행).
      }
    }

    // 2) 폴백: 링크를 클립보드에 복사한다.
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

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>FINAL WINNER</p>
        <h1 className={styles.crown}>
          <span className={styles.crownIcon} aria-hidden="true">
            👑
          </span>
          LAST DISH STANDING
        </h1>
      </header>

      <article className={styles.card}>
        <p className={styles.survivalTitle}>{survivalTitle}</p>

        <div className={styles.photo}>
          <PhotoWithFallback photoUrl={photoUrl} alt={`${name} 대표 이미지`} />
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
    </main>
  );
}

export default WinnerScreen;
