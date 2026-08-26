import { useEffect, useState } from 'react';
import styles from './PhotoWithFallback.module.css';

interface PhotoWithFallbackProps {
  /** 대표 사진 URL(단일). photoUrls 가 있으면 그쪽이 우선한다. */
  photoUrl?: string;
  /** 최대 5장의 사진 URL. 2장 이상이면 갤러리(캐러셀 + 썸네일)로 표시한다. */
  photoUrls?: string[];
  alt: string;
}

/**
 * 식당 사진을 표시한다.
 * - photoUrls 가 2장 이상이면 캐러셀(이전/다음 + 썸네일)로 최대 5장을 볼 수 있다.
 * - 1장이거나 photoUrl 만 있으면 단일 이미지를 표시한다.
 * - 사진이 없거나 현재 이미지 로드에 실패하면 기본 placeholder 를 표시한다.
 * Requirement 16.3: 식당 사진이 없으면 기본 placeholder 이미지를 표시한다.
 */
function PhotoWithFallback({ photoUrl, photoUrls, alt }: PhotoWithFallbackProps) {
  // 표시 후보 목록: photoUrls 우선, 없으면 photoUrl 단일, 둘 다 없으면 빈 배열.
  const urls =
    photoUrls && photoUrls.length > 0
      ? photoUrls
      : photoUrl
        ? [photoUrl]
        : [];

  const [index, setIndex] = useState(0);
  // 개별 URL 별 로드 실패 여부.
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  // 후보 목록이 바뀌면 인덱스를 초기화한다(다른 식당 카드로 교체될 때 등).
  useEffect(() => {
    setIndex(0);
    setFailedUrls({});
  }, [urls.join('|')]);

  const hasPhotos = urls.length > 0;
  const currentUrl = hasPhotos ? urls[Math.min(index, urls.length - 1)] : undefined;
  const showPlaceholder = !currentUrl || failedUrls[currentUrl];
  const isGallery = urls.length > 1;

  const go = (next: number) => {
    if (urls.length === 0) return;
    const wrapped = (next + urls.length) % urls.length;
    setIndex(wrapped);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.viewport}>
        {showPlaceholder ? (
          <div className={styles.placeholder} role="img" aria-label={alt}>
            <span className={styles.placeholderIcon} aria-hidden="true">
              🍽
            </span>
            <span className={styles.placeholderText}>이미지 없음</span>
          </div>
        ) : (
          <img
            className={styles.image}
            src={currentUrl}
            alt={urls.length > 1 ? `${alt} (${index + 1}/${urls.length})` : alt}
            loading="lazy"
            onError={() =>
              setFailedUrls((prev) => ({ ...prev, [currentUrl!]: true }))
            }
          />
        )}

        {isGallery && (
          <>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navPrev}`}
              onClick={() => go(index - 1)}
              aria-label="이전 사진"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.navButton} ${styles.navNext}`}
              onClick={() => go(index + 1)}
              aria-label="다음 사진"
            >
              ›
            </button>
            <span className={styles.counter} aria-hidden="true">
              {index + 1} / {urls.length}
            </span>
          </>
        )}
      </div>

      {isGallery && (
        <div className={styles.thumbs} role="tablist" aria-label="사진 목록">
          {urls.map((url, i) => (
            <button
              key={url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`${i + 1}번째 사진 보기`}
              className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
              onClick={() => setIndex(i)}
            >
              {failedUrls[url] ? (
                <span className={styles.thumbFallback} aria-hidden="true">
                  🍽
                </span>
              ) : (
                <img
                  className={styles.thumbImage}
                  src={url}
                  alt=""
                  loading="lazy"
                  onError={() =>
                    setFailedUrls((prev) => ({ ...prev, [url]: true }))
                  }
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PhotoWithFallback;
