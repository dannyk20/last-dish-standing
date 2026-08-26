import { useEffect, useRef, useState } from 'react';
import type { Restaurant } from '../types';
import PhotoWithFallback from '../components/PhotoWithFallback';
import styles from './RevivalReveal.module.css';

interface RevivalRevealProps {
  /** 부활한 식당 */
  revived: Restaurant;
  /** 연출 시퀀스가 끝난 뒤 한 번 호출된다(제공된 경우). */
  onRevealComplete?: () => void;
}

/**
 * 패자부활전에서 식당을 부활시킨 직후의 짧은 "부활" 연출 단계.
 *
 * 탈락(어둡고 채도 없는 상태)에서 무대로 다시 소환되는 은유를 따라 단계적으로 등장한다.
 *   1) dark    : 부활 대상이 어둡게(회색) 가라앉아 있음
 *   2) surge   : 붉은 부활 에너지가 차오르며 카드가 솟아오름(색/밝기 회복)
 *   3) title   : "REVIVED" 및 별명/식당명이 페이드 인
 *   4) done    : 시퀀스 종료 → onRevealComplete 호출(이후 다음 대결로 진행)
 *
 * 모든 연출은 2D CSS(gradient/filter/opacity/transform 2D)만 사용하며 WebGL/3D는
 * 사용하지 않는다. 진행은 useState/useEffect 타이머로 관리하고 언마운트 시 정리한다.
 * prefers-reduced-motion: reduce 사용자는 단계를 건너뛰고 즉시 완료 처리한다.
 *
 * 패자부활은 RED accent 라인을 따르되, 부활 완료 시 GOLD(생존)로 물들며 마무리한다.
 */
type RevealStage = 'dark' | 'surge' | 'title' | 'done';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 단계별 지연(각 setTimeout 개별 지연). 부활 임팩트와 텍스트를 충분히 보여주도록
// 여유 있게 배치한다: 솟아오름(surge) 후 텍스트(title)가 뜨고, 완료(done)까지
// 텍스트를 약 2.2초간 유지한다(총 약 3.4초).
const STAGE_DELAYS = {
  surge: 450, // dark -> surge
  title: 1150, // surge -> title
  done: 3400, // title -> done
} as const;

function RevivalReveal({ revived, onRevealComplete }: RevivalRevealProps) {
  const reduced = prefersReducedMotion();
  const [stage, setStage] = useState<RevealStage>(reduced ? 'done' : 'dark');
  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  useEffect(() => {
    if (reduced) {
      setStage('done');
      const t = window.setTimeout(() => {
        onRevealCompleteRef.current?.();
      }, 0);
      return () => window.clearTimeout(t);
    }

    setStage('dark');
    const timers: number[] = [];
    timers.push(window.setTimeout(() => setStage('surge'), STAGE_DELAYS.surge));
    timers.push(window.setTimeout(() => setStage('title'), STAGE_DELAYS.title));
    timers.push(
      window.setTimeout(() => {
        setStage('done');
        onRevealCompleteRef.current?.();
      }, STAGE_DELAYS.done),
    );

    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [revived.id, reduced]);

  const revived_ = stage === 'surge' || stage === 'title' || stage === 'done';
  const titleVisible = stage === 'title' || stage === 'done';

  return (
    <section
      className={`${styles.stage} ${revived_ ? styles.stageLit : ''}`}
      data-stage={stage}
      aria-live="polite"
    >
      <p className={`${styles.eyebrow} ${titleVisible ? styles.visible : ''}`}>
        REVIVED
      </p>

      <div
        className={`${styles.cardWrap} ${revived_ ? styles.cardRevived : ''}`}
      >
        {/* 솟아오르는 부활 에너지(붉은→골드) */}
        <span className={styles.aura} aria-hidden="true" />
        <div className={styles.photo}>
          <PhotoWithFallback
            photoUrl={revived.photoUrl}
            photoUrls={revived.photoUrls}
            alt={`${revived.name} 대표 이미지`}
          />
        </div>
      </div>

      <div className={`${styles.caption} ${titleVisible ? styles.visible : ''}`}>
        <p className={styles.survivalTitle}>{revived.survivalTitle}</p>
        <h2 className={styles.name}>{revived.name}</h2>
        <p className={styles.subtitle}>무대로 복귀합니다</p>
      </div>
    </section>
  );
}

export default RevivalReveal;
