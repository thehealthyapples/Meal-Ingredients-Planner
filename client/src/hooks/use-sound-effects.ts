import { useRef, useCallback, useEffect } from "react";

interface UseSoundEffectsOptions {
  enabled?: boolean;
}

export function useSoundEffects(options: UseSoundEffectsOptions = {}) {
  const { enabled = true } = options;
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback((): AudioContext => {
    if (audioContextRef.current) {
      return audioContextRef.current;
    }

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    audioContextRef.current = audioContext;
    return audioContext;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, waveType: OscillatorType) => {
      if (!enabled) return;

      try {
        const audioContext = initAudioContext();

        const now = audioContext.currentTime;
        const endTime = now + duration / 1000;

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = waveType;
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, endTime);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start(now);
        oscillator.stop(endTime);
      } catch (error) {
        console.warn("Error playing sound:", error);
      }
    },
    [enabled, initAudioContext]
  );

  // PX1-W4b (fnd-px-sound-moralises-food). The scan used to be graded aloud: a
  // rating of 5 played a rising major third, a rating of 3–4 a short blip, and a
  // rating of 2 or below a 300ms 220Hz buzz — the sound of disapproval, played at
  // the household over food they had just chosen. EXP §13: "Encouraging, never
  // judgmental — no 'good/bad food'."
  //
  // The sound now confirms that the SCAN LANDED. It does not grade the food, so it
  // takes no rating: the score is shown, calmly, and the household reads it. There
  // is deliberately no parameter to pass a rating to, because a tone that varies by
  // score is the defect, not a feature of it.
  const playScanComplete = useCallback(() => {
    if (!enabled) return;
    playTone(523.25, 120, "sine");
  }, [enabled, playTone]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return { playScanComplete };
}
