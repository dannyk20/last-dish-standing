import { useState } from 'react';
import type { SetupInput } from '../types';
import logoUrl from '../assets/logo.svg';
import styles from './StartScreen.module.css';

interface StartScreenProps {
  onStart: (setup: SetupInput) => void;
  /** 로딩 등 외부 사유로 시작 버튼을 강제 비활성화할 때 사용한다(예: 재입력 차단). */
  disabled?: boolean;
}

/**
 * START / Lobby 화면 (Game_Status: setup).
 * 음식 종류(단일 선택)와 지역(직접 입력 또는 프리셋)을 선택하고 게임을 시작한다.
 *
 * - Requirement 1.1: 8개 음식 종류 중 하나를 선택할 수 있는 UI 제공.
 * - Requirement 1.2: 한 번에 하나의 음식 종류만 선택 상태로 유지.
 * - Requirement 1.3: 지역 직접 입력 또는 프리셋(성수/강남/홍대/잠실/이태원) 선택.
 * - Requirement 1.4: 음식 종류·지역 중 하나 이상 미지정이면 시작 버튼 비활성화.
 * - Requirement 1.5: 음식 종류·지역이 모두 지정되면 시작 버튼 활성화.
 */

// Requirement 1.1: 선택 가능한 음식 종류 목록.
const FOOD_TYPES = [
  '한식',
  '일식',
  '중식',
  '이탈리안',
  '프렌치',
  '양식',
  '카페',
  '디저트',
] as const;

// Requirement 1.3: 미리 제공되는 지역 프리셋.
const REGION_PRESETS = ['성수', '강남', '홍대', '잠실', '이태원'] as const;

function StartScreen({ onStart, disabled = false }: StartScreenProps) {
  // 로컬 UI 상태: 선택된 음식 종류와 지역 입력값.
  const [foodType, setFoodType] = useState<string>('');
  const [region, setRegion] = useState<string>('');

  const trimmedRegion = region.trim();

  // Requirement 1.4 / 1.5: 음식 종류와 지역이 모두 지정되어야 시작 가능.
  const canStart = foodType !== '' && trimmedRegion !== '';
  const startDisabled = disabled || !canStart;

  const handleStart = () => {
    if (startDisabled) return;
    onStart({ foodType, region: trimmedRegion });
  };

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        {/* 무대 조명 글로우: 로고 뒤에서 은은하게 퍼지는 배경 연출 */}
        <div className={styles.spotlightGlow} aria-hidden="true" />

        <img
          className={styles.logo}
          src={logoUrl}
          alt="LAST DISH STANDING 로고"
        />

        {/* 로고가 타이틀 역할을 하므로 흰 글씨 텍스트 타이틀은 두지 않는다.
            태그라인을 양옆 구분선으로 감싸 무대 라벨처럼 강조한다. */}
        <h1 className={styles.tagline}>
          <span className={styles.taglineRule} aria-hidden="true" />
          <span className={styles.taglineText}>Only one restaurant survives.</span>
          <span className={styles.taglineRule} aria-hidden="true" />
        </h1>

        <p className={styles.subtitle}>
          지역과 음식 종류를 골라 서바이벌을 시작하세요.
        </p>
      </header>

      {/* 음식 종류 선택 (단일 선택) */}
      <section className={styles.section} aria-labelledby="foodType-label">
        <h2 id="foodType-label" className={styles.sectionLabel}>
          음식 종류
        </h2>
        <div className={styles.chipGroup} role="radiogroup" aria-label="음식 종류">
          {FOOD_TYPES.map((food) => {
            const selected = foodType === food;
            return (
              <button
                key={food}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                // Requirement 1.2: 항상 하나만 선택 상태로 유지(단일 값 교체).
                onClick={() => setFoodType(food)}
              >
                {food}
              </button>
            );
          })}
        </div>
      </section>

      {/* 지역 선택 (직접 입력 또는 프리셋) */}
      <section className={styles.section} aria-labelledby="region-label">
        <h2 id="region-label" className={styles.sectionLabel}>
          지역
        </h2>
        <input
          type="text"
          className={styles.regionInput}
          placeholder="지역을 직접 입력하세요 (예: 연남동)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          aria-label="지역 직접 입력"
        />
        <div
          className={styles.chipGroup}
          role="group"
          aria-label="지역 프리셋"
        >
          {REGION_PRESETS.map((preset) => {
            const selected = trimmedRegion === preset;
            return (
              <button
                key={preset}
                type="button"
                aria-pressed={selected}
                className={`${styles.chip} ${selected ? styles.chipSelected : ''}`}
                onClick={() => setRegion(preset)}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </section>

      <button
        type="button"
        className={styles.startButton}
        disabled={startDisabled}
        onClick={handleStart}
      >
        START
      </button>
    </main>
  );
}

export default StartScreen;
