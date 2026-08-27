import { useEffect, useRef, useState } from 'react';
import type { Restaurant } from '../types';
import Spotlight from '../components/Spotlight';
import PhotoWithFallback from '../components/PhotoWithFallback';
import { playSound } from '../lib/sound';
import styles from './ChampionReveal.module.css';

interface ChampionRevealProps {
  winner: Restaurant;
  /** 연출 시퀀스가 끝난 뒤 한 번 호출된다(제공된 경우). */
  onRevealComplete?: () => void;
}

/**
 * 최종 WINNER 확정 순간의 짧은 스포트라이트 연출 단계.
 *
 * 무대 조명 은유를 따라 단계적으로 등장시킨다.
 *   1) dim   : 무대가 어두운 상태(스포트라이트 OFF)
 *   2) spot  : 승자 위로 Gold 스포트라이트가 켜짐(Spotlight 'on')
 *   3) title : 별명/식당명 텍스트가 페이드 인
 *   4) done  : 시퀀스 종료 → onRevealComplete 호출
 *
 * 상태 전환은 200~600ms 범위의 가벼운 CSS transition만 사용하며(WebGL/3D 금지),
 * 진행은 useState/useEffect 타이머로 관리한다(언마운트 시 정리).
 *
 * prefers-reduced-motion: reduce 사용자는 단계를 건너뛰고 즉시 최종 상태로 표시한다.
 *
 * 자체 완결형 표현 컴포넌트로, App 와이어링은 별도 task(9.3, 부활 흐름 와이어링)에서 처리한다.
 *
 * Requirements 14.1 (및 Spotlight/애니메이션 설계).
 */
type RevealStage = 'dim' | 'spot' | 'title' | 'done';

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// 단계별 지연(누적 아님, 각 setTimeout 개별 지연). 200~600ms 범위 유지.
const STAGE_DELAYS = {
  spot: 250, // dim -> spot
  title: 550, // spot -> title
  done: 950, // title -> done
} as const;

function ChampionReveal({ winner, onRevealComplete }: ChampionRevealProps) {
  const reduced = prefersReducedMotion();
  const [stage, setStage] = useState<RevealStage>(reduced ? 'done' : 'dim');
  // 콜백 최신값을 유지해 타이머 재설정을 피한다.
  const onRevealCompleteRef = useRef(onRevealComplete);
  onRevealCompleteRef.current = onRevealComplete;

  useEffect(() => {
    // 모션 최소화 선호 시 즉시 완료 처리. 우승 "두둥" 효과음은 즉시 재생한다.
    if (reduced) {
      playSound('final');
      setStage('done');
      const t = window.setTimeout(() => {
        onRevealCompleteRef.current?.();
      }, 0);
      return () => window.clearTimeout(t);
    }

    setStage('dim');
    const timers: number[] = [];
    // 스포트라이트가 켜지는 순간(spot)에 맞춰 최종 우승 "두둥" 효과음을 재생한다.
    timers.push(
      window.setTimeout(() => {
        setStage('spot');
        playSound('final');
      }, STAGE_DELAYS.spot),
    );
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
    // winner 변경 시 시퀀스를 재시작한다.
  }, [winner.id, reduced]);

  const spotlightOn = stage === 'spot' || stage === 'title' || stage === 'done';
  const titleVisible = stage === 'title' || stage === 'done';

  return (
    <section
      className={`${styles.stage} ${spotlightOn ? styles.stageLit : ''}`}
      data-stage={stage}
      aria-live="polite"
    >
      <p className={`${styles.eyebrow} ${titleVisible ? styles.visible : ''}`}>
        NEW CHAMPION
      </p>

      <div className={styles.spotlightWrap}>
        <Spotlight state={spotlightOn ? 'on' : 'neutral'}>
          <div className={styles.photo}>
            <PhotoWithFallback
              photoUrl={winner.photoUrl}
              alt={`${winner.name} 대표 이미지`}
            />
          </div>
        </Spotlight>
      </div>

      <div className={`${styles.caption} ${titleVisible ? styles.visible : ''}`}>
        <p className={styles.survivalTitle}>{winner.survivalTitle}</p>
        <h2 className={styles.name}>{winner.name}</h2>
      </div>
    </section>
  );
}

export default ChampionReveal;
