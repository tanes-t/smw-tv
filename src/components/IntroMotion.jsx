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

      // Ta (Sub Bass Impact)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(65, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.5);
      gain1.gain.setValueAtTime(0.4, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.6);

      // Dum (Deep Warm Resonant Industrial Chime)
      setTimeout(() => {
        if (ctx.state === 'closed') return;
        const now = ctx.currentTime;
        
        // Root Note
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(130.81, now); // C3
        osc2.frequency.exponentialRampToValueAtTime(123.47, now + 1.2);
        gain2.gain.setValueAtTime(0.5, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now);
        osc2.stop(now + 1.6);

        // Fifth Harmony (G3)
        const osc3 = ctx.createOscillator();
        const gain3 = ctx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(196.00, now);
        gain3.gain.setValueAtTime(0.3, now);
        gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc3.connect(gain3);
        gain3.connect(ctx.destination);
        osc3.start(now);
        osc3.stop(now + 1.8);

        // High Shimmer (C5 Bell)
        const osc4 = ctx.createOscillator();
        const gain4 = ctx.createGain();
        osc4.type = 'sine';
        osc4.frequency.setValueAtTime(523.25, now);
        gain4.gain.setValueAtTime(0.15, now);
        gain4.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
        osc4.connect(gain4);
        gain4.connect(ctx.destination);
        osc4.start(now);
        osc4.stop(now + 2.0);
      }, 250);
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
    }, 450);

    // Stage 1: Ignite to Form (at 400ms)
    const t1 = setTimeout(() => {
      setStage('form');
    }, 400);

    // Stage 2: Form to Reveal (at 1200ms)
    const t2 = setTimeout(() => {
      setStage('reveal');
    }, 1200);

    // Stage 3: Zoom Through (at 2300ms)
    const t3 = setTimeout(() => {
      setStage('zoom');
    }, 2300);

    // Stage 4: Completed (at 2900ms)
    const t4 = setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 2900);

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
