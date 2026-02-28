// src/ssr/projects/dataviz.enhancer.tsx
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTooltipInit } from '../../components/general-ui/tooltip/tooltipInit';
import PannableMedia from '../../services/media/useMediaPannable';
import MediaLoader from '../../services/media/useMediaLoader';
import { useVideoObserverSSR } from '../../behaviors/useVideoObserverSSR';

type VideoSet = { webmUrl?: string; mp4Url?: string; poster?: string };

function readSet(container: HTMLElement, prefix: 'h' | 'v') {
  const ds = container.dataset as Record<string, string | undefined>;
  const webm = ds[`${prefix}Webm`] || ds[`${prefix}-webm`];
  const mp4 = ds[`${prefix}Mp4`] || ds[`${prefix}-mp4`];
  const posterMed = ds[`${prefix}PosterMed`] || ds[`${prefix}-poster-med`];
  const posterFull = ds[`${prefix}PosterFull`] || ds[`${prefix}-poster-full`];

  return {
    webmUrl: webm || undefined,
    mp4Url: mp4 || undefined,
    posterMed: posterMed || undefined,
    posterFull: posterFull || undefined,
  };
}

function pickVideoSet(container: HTMLElement): VideoSet | null {
  const horiz = readSet(container, 'h');
  const vert = readSet(container, 'v');

  const isVertical = window.innerHeight > window.innerWidth;
  const vertExists = Boolean(vert.mp4Url || vert.webmUrl);
  const chosen = isVertical && vertExists ? vert : horiz;

  if (!Boolean(chosen.mp4Url || chosen.webmUrl)) return null;

  return {
    mp4Url: chosen.mp4Url,
    webmUrl: chosen.webmUrl,
    poster: chosen.posterFull || chosen.posterMed,
  };
}

export default function DataVizEnhancer() {
  useTooltipInit();

  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const c = document.getElementById('dataviz-media-container') as HTMLElement | null;
    const m = document.getElementById('dataviz-video-mount') as HTMLElement | null;
    if (!c || !m) return;

    setContainer(c);
    setMount(m);

    const onResize = () => setTick((x) => x + 1);
    window.addEventListener('resize', onResize, { passive: true });
    window.addEventListener('orientationchange', onResize, { passive: true });

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);

  const videoSet = useMemo(() => {
    if (!container) return null;
    void tick;
    return pickVideoSet(container);
  }, [container, tick]);

  useVideoObserverSSR({
    videoId: 'dataviz-media-video',
    observeTargetId: 'dataviz-media-container',
    threshold: 0.15,
    enabled: true,
    playOnInit: true,
  });

  if (!mount || !videoSet) return null;

  return createPortal(
    <PannableMedia sensitivity={2}>
      <MediaLoader
        type="video"
        src={videoSet}
        alt="Data Visualization"
        id="dataviz-media-video"
        className="tooltip-data-viz"
        preload="auto"
        muted
        playsInline
        loop
        style={{ width: '100%', height: '100%' }}
        objectPosition="50% 0%"
      />
    </PannableMedia>,
    mount
  );
}