// 게임 효과음 (LAST DISH STANDING)
//
// 외부 오디오 파일이나 네트워크 없이 Web Audio API 로 짧은 효과음을 합성한다.
// 8-bit 오락실 느낌을 피하고 넷플릭스/TV쇼풍의 부드럽고 두께 있는 톤을 목표로 한다:
//   - 각 음을 살짝 디튠한 2개 오실레이터로 겹쳐 두께/따뜻함을 준다.
//   - 로우패스 필터로 거친 하모닉스를 다듬고, 부드러운 어택/릴리즈로 감싼다.
//   - 최종 우승음은 저역 서브 타격 + 리버스 노이즈 스웰 + 화음으로 시네마틱하게.
// 각 소리는 최대 약 1초 이내이다.
//   - 'select' : 1~7 라운드 + 마지막 라운드 일반 선택. 보통 강도.
//   - 'revive' : 패자부활전에서 부활 선택. 중간 강도.
//   - 'final'  : 최종 우승자 발표. "두둥" 임팩트(저역 타격 + 스웰 + 화음).
//
// 브라우저 자동재생 정책상 오디오는 사용자 제스처(클릭 등) 컨텍스트에서
// 시작되어야 한다. AudioContext 미지원(SSR/jsdom 테스트 등) 환경에서는 조용히
// 무시하여 앱 동작에 영향을 주지 않는다.

export type SoundKind = 'select' | 'revive' | 'final';

type AudioCtor = typeof AudioContext;

let audioContext: AudioContext | null = null;

/** AudioContext 생성자(webkit 프리픽스 포함)를 안전하게 얻는다. 없으면 null. */
function getAudioContextCtor(): AudioCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioCtor;
    webkitAudioContext?: AudioCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/** 공유 AudioContext 를 지연 생성하고, 정지 상태이면 재개한다. 미지원 시 null. */
function ensureContext(): AudioContext | null {
  const Ctor = getAudioContextCtor();
  if (!Ctor) return null;
  try {
    if (!audioContext) {
      audioContext = new Ctor();
    }
    if (audioContext.state === 'suspended') {
      void audioContext.resume().catch(() => {});
    }
    return audioContext;
  } catch {
    return null;
  }
}

interface NoteOptions {
  freq: number;
  startAt: number; // ctx.currentTime 기준 상대 지연(초)
  duration: number; // 톤 길이(초)
  type?: OscillatorType;
  peak?: number; // 최대 게인(0~1)
  attack?: number; // 어택 시간(초)
  release?: number; // 릴리즈(감쇠) 시작을 duration 끝에서 얼마나 당길지(초)
  cutoff?: number; // 로우패스 컷오프(Hz)
  detune?: number; // 두께용 디튠(cents). 지정 시 살짝 어긋난 2번째 osc 레이어 추가.
  glideTo?: number; // 지정 시 duration 동안 이 주파수로 미끄러진다.
}

/**
 * 하나의 음을 스케줄링한다. detune 지정 시 살짝 어긋난 2개 오실레이터를 겹쳐
 * (유니즌) 두께와 따뜻함을 준다. 로우패스 + 부드러운 엔벨로프로 감싼다.
 */
function scheduleNote(
  ctx: AudioContext,
  destination: AudioNode,
  options: NoteOptions,
): void {
  const {
    freq,
    startAt,
    duration,
    type = 'sine',
    peak = 0.16,
    attack = 0.02,
    cutoff = 3200,
    detune,
    glideTo,
  } = options;
  const t0 = ctx.currentTime + startAt;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + attack);
  // 릴리즈: 완만한 지수 감쇠로 부드러운 꼬리를 남긴다.
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, t0);
  filter.Q.setValueAtTime(0.6, t0);
  filter.connect(gain).connect(destination);

  // 유니즌 레이어(디튠 포함/미포함) 구성.
  const detunes = detune ? [-detune, detune] : [0];
  for (const d of detunes) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, glideTo), t0 + duration);
    }
    if (d !== 0) osc.detune.setValueAtTime(d, t0);
    osc.connect(filter);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
}

/**
 * 필터를 통과한 짧은 노이즈 스웰(리버스 심벌 느낌)을 스케줄링한다.
 * 최종 우승 연출의 "차오르는" 긴장감을 위해 사용한다.
 */
function scheduleNoiseSwell(
  ctx: AudioContext,
  destination: AudioNode,
  options: { startAt: number; duration: number; peak: number },
): void {
  const { startAt, duration, peak } = options;
  const t0 = ctx.currentTime + startAt;

  const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  // 밴드패스로 "쉬~" 하는 부드러운 스웰 질감을 만든다.
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(1200, t0);
  bp.frequency.exponentialRampToValueAtTime(6000, t0 + duration); // 점점 밝아지며 차오름
  bp.Q.setValueAtTime(0.8, t0);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + duration * 0.85); // 서서히 차오르고
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration); // 끝에서 사라짐

  src.connect(bp).connect(gain).connect(destination);
  src.start(t0);
  src.stop(t0 + duration + 0.05);
}

/**
 * 효과음 재생. 사용자 제스처(클릭) 핸들러 안에서 호출해야 한다.
 * 미지원/오류 시 조용히 무시한다.
 */
export function playSound(kind: SoundKind): void {
  const ctx = ensureContext();
  if (!ctx) return;

  try {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.85, ctx.currentTime);
    master.connect(ctx.destination);

    if (kind === 'select') {
      // 보통: 따뜻하게 겹친 상승 2음. 부드럽고 산뜻하게 (~0.35초).
      scheduleNote(ctx, master, {
        freq: 659.25, // E5
        startAt: 0,
        duration: 0.15,
        peak: 0.13,
        attack: 0.012,
        cutoff: 2400,
        detune: 6,
      });
      scheduleNote(ctx, master, {
        freq: 987.77, // B5
        startAt: 0.09,
        duration: 0.28,
        peak: 0.15,
        attack: 0.012,
        cutoff: 3000,
        detune: 6,
      });
      return;
    }

    if (kind === 'revive') {
      // 중간: 밝은 상승 3음 + 옥타브 마무리(유니즌 두께). 살짝 화려하되 부드럽게 (~0.7초).
      scheduleNote(ctx, master, { freq: 523.25, startAt: 0, duration: 0.16, peak: 0.13, cutoff: 2600, detune: 6 }); // C5
      scheduleNote(ctx, master, { freq: 659.25, startAt: 0.13, duration: 0.16, peak: 0.14, cutoff: 2800, detune: 6 }); // E5
      scheduleNote(ctx, master, { freq: 783.99, startAt: 0.26, duration: 0.18, peak: 0.15, cutoff: 3000, detune: 6 }); // G5
      scheduleNote(ctx, master, { freq: 1046.5, startAt: 0.4, duration: 0.36, peak: 0.16, cutoff: 3400, detune: 8 }); // C6
      return;
    }

    // final: "두둥" — 저역 서브 타격 2방 + 리버스 노이즈 스웰 + 승리 화음 스웰 (~1초).
    // 0) 리버스 스웰: 첫 타격 직전까지 긴장감이 차오른다.
    scheduleNoiseSwell(ctx, master, { startAt: 0, duration: 0.34, peak: 0.06 });

    // 1) 첫 "두": 묵직한 저역 타격(살짝 하강하는 서브).
    scheduleNote(ctx, master, {
      freq: 155.56, // D#3
      startAt: 0.34,
      duration: 0.4,
      peak: 0.34,
      attack: 0.005,
      cutoff: 700,
      glideTo: 98, // G2 부근으로 하강
    });
    scheduleNote(ctx, master, {
      freq: 77.78, // 한 옥타브 아래 서브로 무게 보강
      startAt: 0.34,
      duration: 0.42,
      peak: 0.22,
      attack: 0.006,
      cutoff: 500,
    });

    // 2) 두 번째 "둥": 더 크고 길게, 승리 화음이 그 위로 차오른다.
    scheduleNote(ctx, master, {
      freq: 174.61, // F3
      startAt: 0.66,
      duration: 0.6,
      peak: 0.36,
      attack: 0.005,
      cutoff: 800,
      glideTo: 110, // A2 부근으로 하강
    });
    scheduleNote(ctx, master, {
      freq: 87.31, // 서브 보강
      startAt: 0.66,
      duration: 0.62,
      peak: 0.24,
      attack: 0.006,
      cutoff: 500,
    });

    // 3) 승리 화음 스웰: C 장화음(C5+E5+G5)이 부드럽게 차올라 여운을 남긴다.
    scheduleNote(ctx, master, { freq: 523.25, startAt: 0.72, duration: 0.62, peak: 0.14, attack: 0.1, cutoff: 3200, detune: 7 }); // C5
    scheduleNote(ctx, master, { freq: 659.25, startAt: 0.74, duration: 0.6, peak: 0.12, attack: 0.1, cutoff: 3200, detune: 7 }); // E5
    scheduleNote(ctx, master, { freq: 783.99, startAt: 0.76, duration: 0.58, peak: 0.11, attack: 0.1, cutoff: 3200, detune: 7 }); // G5
  } catch {
    // 재생 중 오류는 무시한다(앱 흐름에 영향 없음).
  }
}

/**
 * 오디오 컨텍스트를 사용자 제스처에서 미리 준비(warm up)한다.
 * 첫 클릭(START 등)에서 호출하면 이후 효과음이 지연 없이 재생된다.
 */
export function primeAudio(): void {
  ensureContext();
}
