import { useEffect, useState, useRef } from 'react';

/**
 * Cinematic Netflix-style Intro Motion for SMW-TV
 * Includes Web Audio API synthetic "Ta-Dum" chime and visual laser beam formation
 */
export default function IntroMotion({ onComplete }) {
  const [stage, setStage] = useState('ignite'); // 'ignite' | 'form' | 'reveal' | 'zoom' | 'done'
  const hasPlayedSoundRef = useRef(false);

  const canSkipRef = useRef(false);

  // Play synthetic cinematic "Ta-Dum" sound using Web Audio API
  const playCinematicAudio = () => {
    if (hasPlayedSoundRef.current) return;
    hasPlayedSoundRef.current = true;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        // Do not force resume if there's no user gesture yet to prevent browser warnings
        const resumeOnInteraction = () => {
          ctx.resume().catch(() => {});
          window.removeEventListener('click', resumeOnInteraction);
          window.removeEventListener('keydown', resumeOnInteraction);
          window.removeEventListener('touchstart', resumeOnInteraction);
        };
        window.addEventListener('click', resumeOnInteraction, { once: true });
        window.addEventListener('keydown', resumeOnInteraction, { once: true });
        window.addEventListener('touchstart', resumeOnInteraction, { once: true });
        return;
      }

      // Ta (Sub Bass Impact)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(80, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.4);
      gain1.gain.setValueAtTime(0.35, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.45);

      // Dum (Deep Warm Industrial Harmony)
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        
        // Root Note (C3)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(130.81, now);
        osc2.frequency.exponentialRampToValueAtTime(123.47, now + 1.0);
        gain2.gain.setValueAtTime(0.4, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 1.2);

        // Fifth Harmony (G3)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(196.00, now);
        gain3.gain.setValueAtTime(0.25, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now);
        osc3.stop(now + 1.3);
      }, 200);
    } catch {
      // Audio autoplay policies may block, continue visually without error
    }
  };

  const triggerSkip = (e) => {
    if (!canSkipRef.current) return;
    playCinematicAudio();
    setStage('done');
    onComplete?.();
    e?.stopPropagation?.();
  };

  useEffect(() => {
    // Attempt audio on start
    playCinematicAudio();

    // Prevent instant dismissal from the same click event
    const graceTimer = setTimeout(() => {
      canSkipRef.current = true;
    }, 200);

    // Stage 1: Ignite to Form (at 200ms)
    const t1 = setTimeout(() => {
      setStage('form');
    }, 200);

    // Stage 2: Form to Reveal (at 700ms)
    const t2 = setTimeout(() => {
      setStage('reveal');
    }, 700);

    // Stage 3: Zoom Through (at 1400ms)
    const t3 = setTimeout(() => {
      setStage('zoom');
    }, 1400);

    // Stage 4: Completed (at 1800ms)
    const t4 = setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 1800);

    // Keyboard / remote listener to skip
    const handleKeyDown = (e) => {
      if (!canSkipRef.current) return;
      triggerSkip(e);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(graceTimer);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  return (
    <div 
      className={`intro-motion-overlay ${stage}`}
      onClick={triggerSkip}
    >
      {/* Background radial atmosphere */}
      <div className="intro-radial-bg" />

      {/* Center Laser Beam */}
      <div className="intro-laser-line" />

      {/* Main Logo Container */}
      <div className="intro-brand-wrapper">
        <div className="intro-letters-container">
          {/* S */}
          <span className="intro-char char-s">
            <span className="char-glow">S</span>
            <span className="char-front">S</span>
          </span>

          {/* M */}
          <span className="intro-char char-m">
            <span className="char-glow">M</span>
            <span className="char-front">M</span>
          </span>

          {/* W */}
          <span className="intro-char char-w">
            <span className="char-glow">W</span>
            <span className="char-front">W</span>
          </span>

          {/* TV Badge */}
          <span className="intro-tv-badge">TV</span>
        </div>

        {/* Cinematic Flare Bar */}
        <div className="intro-flare-bar" />

        {/* Subtitle & Tagline */}
        <div className="intro-sub-content">
          <p className="intro-tagline">SMART MANUFACTURING WALLBOARD</p>
          <p className="intro-corp">SIAM METAL WORK • LIVE STREAMING</p>
        </div>
      </div>

      {/* Skip Button Tip */}
      <div className="intro-skip-hint">
        <span>กดปุ่มใดๆ เพื่อข้าม (Skip ▶)</span>
      </div>
    </div>
  );
}
