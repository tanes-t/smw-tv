import { useEffect, useRef } from 'react';

/**
 * High-Performance Pure CSS Keyframe Intro Motion for SMW-TV
 * Designed specifically for Smart TV hardware to eliminate JS re-render stutter.
 */
export default function IntroMotion({ onComplete }) {
  const completedRef = useRef(false);

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  useEffect(() => {
    // Play optional Web Audio ta-dum sound without blocking main thread
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'running') {
          // Quick warm ta-dum
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(75, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.35);
          gain1.gain.setValueAtTime(0.3, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start();
          osc1.stop(ctx.currentTime + 0.4);

          setTimeout(() => {
            if (ctx.state === 'closed') return;
            const now = ctx.currentTime;
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(130.81, now);
            gain2.gain.setValueAtTime(0.35, now);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(now);
            osc2.stop(now + 2.5);
          }, 200);
        }
      }
    } catch {
      // Audio autoplay policy fallback
    }

    // Auto-complete intro when animation finishes (5 seconds)
    const timer = setTimeout(handleFinish, 5000);

    const handleKeyOrClick = () => {
      handleFinish();
    };

    window.addEventListener('keydown', handleKeyOrClick);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyOrClick);
    };
  }, []);

  return (
    <div 
      className="intro-motion-overlay pure-keyframe-intro"
      onClick={handleFinish}
    >
      {/* Background radial atmosphere */}
      <div className="intro-radial-bg" />

      {/* Main Logo Container */}
      <div className="intro-brand-wrapper">
        <div className="intro-letters-container">
          <div className="intro-letters-group">
            <span className="intro-char char-s">S</span>
            <span className="intro-char char-m">M</span>
            <span className="intro-char char-w">W</span>
            <span className="intro-tv-badge">TV</span>
          </div>
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
