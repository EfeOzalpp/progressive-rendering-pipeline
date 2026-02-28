// src/dynamic-app/components/pauseButton.jsx
import React, { useRef, useState, useEffect } from 'react';
import lottie from '../../behaviors/load-lottie';
import animationData from '../../json-assets/pauseButton.json';

const INITIAL_FRAME = 3;   // <-- set this to the frame with the correct color
const HOVER_END = 10;
const CLICK_FRAME = 20;

const PauseButton = ({ toggleP5Animation }) => {
  const containerRef = useRef(null);
  const animRef = useRef(null);

  const [isClicked, setIsClicked] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(INITIAL_FRAME);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (toggleP5Animation) toggleP5Animation(!isClicked);
  }, [toggleP5Animation, isClicked]);

  useEffect(() => {
    if (!containerRef.current) return;
    let mounted = true;

    const lockDefaultFrame = (anim) => {
      // Make the animation's "world" start at INITIAL_FRAME, not 0.
      const end = Math.max(INITIAL_FRAME + 1, Math.floor(anim.totalFrames || INITIAL_FRAME + 1));
      anim.setSegment(INITIAL_FRAME, end);

      // Force render the correct default frame.
      anim.goToAndStop(INITIAL_FRAME, true);

      // Two RAFs helps ensure the SVG paints the forced frame before showing.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!mounted) return;
          anim.goToAndStop(INITIAL_FRAME, true);
          if (typeof anim.resize === 'function') anim.resize();
          setReady(true);
        });
      });
    };

    lottie
      .loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData,
      })
      .then((anim) => {
        if (!mounted) return;
        animRef.current = anim;

        const onDomLoaded = () => lockDefaultFrame(anim);
        anim.addEventListener('DOMLoaded', onDomLoaded);
        animRef.current.__onDomLoaded = onDomLoaded;

        // In case DOMLoaded already happened / resolves late:
        lockDefaultFrame(anim);
      });

    return () => {
      mounted = false;
      if (animRef.current) {
        const fn = animRef.current.__onDomLoaded;
        if (fn) animRef.current.removeEventListener('DOMLoaded', fn);
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, []);

  const handleMouseEnter = () => {
    const anim = animRef.current;
    if (!ready || !anim || isClicked) return;
    anim.playSegments([INITIAL_FRAME, HOVER_END], true);
  };

  const handleMouseLeave = () => {
    const anim = animRef.current;
    if (!ready || !anim || isClicked) return;
    anim.goToAndStop(currentFrame, true);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    const anim = animRef.current;
    if (!ready || !anim) return;

    const nextClicked = !isClicked;
    const targetFrame = nextClicked ? CLICK_FRAME : INITIAL_FRAME;

    anim.playSegments([currentFrame, targetFrame], true);
    setCurrentFrame(targetFrame);
    setIsClicked(nextClicked);

    if (toggleP5Animation) toggleP5Animation(!nextClicked);
  };

  return (
    <div
      className="lottie-container"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 120ms linear' }}
    />
  );
};

export default PauseButton;