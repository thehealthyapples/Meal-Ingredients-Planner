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

  const playSound = useCallback(
    (rating: number) => {
      if (!enabled) return;

      if (rating === 5) {
        playTone(523.25, 150, "sine");
        setTimeout(() => {
          playTone(659.25, 150, "sine");
        }, 160);
      } else if (rating <= 2) {
        playTone(220, 300, "triangle");
      } else if (rating >= 3 && rating <= 4) {
        playTone(800, 50, "square");
      }
    },
    [enabled, playTone]
  );

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return { playSound };
}
