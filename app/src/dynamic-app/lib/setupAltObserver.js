// src/dynamic-app/lib/setupAltObserver.js

const DEFAULT_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

const setupAltObserver = (
  onActivate,
  onDeactivate,
  rootElement = document,
  {
    onActivateMany = null,   // Gets (altsArray) ranked best->worst
    topN = 3,                // How many to return
    minVisible = 0.12,
    thresholds = DEFAULT_THRESHOLDS,
    root = null,
    rootMargin = '1200px 0px 1200px 0px',
    bootstrap = true,        // run a synchronous first pick: 
    // Triggered by immediate gemotery math rather than waiting for IO callback
  } = {}
) => {
  let activeAlt = null;
  let activeMany = [];

  const normalizeAlt = (v) =>
    String(v ?? '')
      .replace(/\u00A0/g, ' ')
      .normalize('NFKC')
      .replace(/\s+/g, ' ')
      .trim();

  const getAlt1 = (cardEl) => {
    const img = cardEl.querySelector('.ui-image1');
    return normalizeAlt(img?.getAttribute('alt')) || null;
  };

  const rankCandidates = (entries) => {
    const viewportCenterY = (window.innerHeight || 0) / 2;

    return entries
      .map((e) => {
        const alt = getAlt1(e.target);
        if (!alt) return null;

        const ratio = e.intersectionRatio ?? 0;
        const rect = e.boundingClientRect;
        const centerY = rect.top + rect.height / 2;
        const distToCenter = Math.abs(centerY - viewportCenterY);

        return { alt, ratio, distToCenter, top: rect.top };
      })
      .filter((x) => x && x.ratio >= minVisible)
      .sort((a, b) => {
        if (b.ratio !== a.ratio) return b.ratio - a.ratio;
        if (a.distToCenter !== b.distToCenter) return a.distToCenter - b.distToCenter;
        return a.top - b.top;
      });
  };

  const pickWinner = (entries) => {
    const ranked = rankCandidates(entries);
    return ranked.length ? ranked[0].alt : null;
  };

  const pickTopN = (entries, n) => {
    const ranked = rankCandidates(entries);
    const out = [];
    const seen = new Set();

    for (const c of ranked) {
      if (seen.has(c.alt)) continue;
      seen.add(c.alt);
      out.push(c.alt);
      if (out.length >= n) break;
    }
    return out;
  };

  const sameList = (a, b) =>
    a.length === b.length && a.every((v, i) => v === b[i]);

  // INTERSECTION OBSERVER
  const observer = new IntersectionObserver(
    (entries) => {
      const next = pickWinner(entries);
      const nextMany = pickTopN(entries, topN);

      if (!sameList(nextMany, activeMany)) {
        activeMany = nextMany;
        onActivateMany?.(activeMany);
      }

      if (next === activeAlt) return;

      if (activeAlt) onDeactivate(activeAlt);
      if (next) onActivate(next);

      activeAlt = next;
    },
    {
      root,
      rootMargin,
      threshold: thresholds,
    }
  );

  const cards = Array.from(rootElement.querySelectorAll('.card-container'));
  cards.forEach((card) => observer.observe(card));

  // BOOTSTRAP: compute initial "best visible" synchronously (no waiting for IO tick)
  if (bootstrap && typeof window !== 'undefined') {
    const parseRootMarginTB = (rm) => {
      // supports "top right bottom left" px form, uses top/bottom only
      const parts = String(rm || '').split(/\s+/);
      const top = parseFloat(parts[0]) || 0;
      const bottom = parseFloat(parts[2] ?? parts[0]) || 0;
      return { top, bottom };
    };

    const { top: rmTop, bottom: rmBottom } = parseRootMarginTB(rootMargin);

    const viewportTop = 0 - rmTop;
    const viewportBottom = (window.innerHeight || 0) + rmBottom;

    const syntheticEntries = cards.map((el) => {
      const rect = el.getBoundingClientRect();
      const overlap = Math.min(rect.bottom, viewportBottom) - Math.max(rect.top, viewportTop);
      const ratio = rect.height > 0 ? Math.max(0, Math.min(1, overlap / rect.height)) : 0;
      return {
        target: el,
        boundingClientRect: rect,
        intersectionRatio: ratio,
      };
    });

    const next = pickWinner(syntheticEntries);
    const nextMany = pickTopN(syntheticEntries, topN);

    if (!sameList(nextMany, activeMany)) {
      activeMany = nextMany;
      onActivateMany?.(activeMany);
    }

    if (next && next !== activeAlt) {
      if (activeAlt) onDeactivate(activeAlt);
      onActivate(next);
      activeAlt = next;
    }
  }

  return () => observer.disconnect();
};

export default setupAltObserver;