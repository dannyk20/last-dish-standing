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
