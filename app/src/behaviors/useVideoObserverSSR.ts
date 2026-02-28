// src/services/media/useVideoObserverSSR.ts
import { useEffect, useRef } from 'react';

export type UseVideoObserverSSROptions = {
  videoId: string;
  observeTargetId?: string;
  threshold?: number;
  enabled?: boolean;
  playOnInit?: boolean;
};

export function useVideoObserverSSR({
  videoId,
  observeTargetId,
  threshold = 0.15,
  enabled = true,
  playOnInit = true,
}: UseVideoObserverSSROptions) {
  const cleanupRef = useRef<null | (() => void)>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let mo: MutationObserver | null = null;

    const stop = () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (mo) {
        mo.disconnect();
        mo = null;
      }
    };

    const attach = () => {
      if (cancelled) return false;

      const video = document.getElementById(videoId) as HTMLVideoElement | null;
      const observeTarget =
        (observeTargetId ? (document.getElementById(observeTargetId) as HTMLElement | null) : null) ?? video;

      if (!video || !observeTarget) return false;

      stop();

      const playSafe = () => {
        if (cancelled) return;
        if (!document.contains(video)) return;
        video.play().catch(() => {});
      };

      const pauseSafe = () => {
        if (cancelled) return;
        try {
          video.pause();
        } catch {}
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry) return;
          if (entry.isIntersecting) playSafe();
          else pauseSafe();
        },
        { threshold }
      );

      io.observe(observeTarget);

      const onVis = () => {
        if (document.hidden) pauseSafe();
        else playSafe();
      };
      document.addEventListener('visibilitychange', onVis);

      if (playOnInit) playSafe();

      cleanupRef.current = () => {
        io.disconnect();
        document.removeEventListener('visibilitychange', onVis);
      };

      return true;
    };

    if (attach()) {
      return () => {
        cancelled = true;
        stop();
      };
    }

    mo = new MutationObserver(() => {
      if (cleanupRef.current) return;
      attach();
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      cancelled = true;
      stop();
    };
  }, [videoId, observeTargetId, threshold, enabled, playOnInit]);
}