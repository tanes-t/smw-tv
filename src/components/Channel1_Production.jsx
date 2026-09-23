import { useState, useEffect, useRef } from 'react';

export default function Channel1_Production({ apiUrl }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Defer setState to avoid React deprecation warning
    // by using setTimeout to flush DOM before state update
    const loadingTimer = setTimeout(() => {
      setIsLoading(true);
      setHasError(false);
    }, 0);
    return () => clearTimeout(loadingTimer);
  }, [apiUrl]);

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      overflow: 'hidden',
      height: '100%',
      borderRadius: '12px',
      position: 'relative',
      background: '#0a0a0a'
    }}>
      {/* Loading Overlay */}
      {isLoading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#0a0a0a',
          zIndex: 10,
          gap: '1.5rem'
        }}>
          <div style={{
            fontSize: '1.1rem',
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#fff',
            textTransform: 'uppercase'
          }}>
            SIAM<span style={{ color: '#e53e3e' }}>METAL</span>WORK
          </div>
          <div style={{
            fontSize: '0.7rem',
            color: '#888',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase'
          }}>
            LOADING PRODUCTION DASHBOARD...
          </div>
          <div style={{
            width: '240px',
            height: '2px',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, #e53e3e, #fff)',
              animation: 'loadbar 1.8s infinite ease-in-out'
            }} />
          </div>
          <style>{`
            @keyframes loadbar {
              0% { width: 0%; margin-left: 0; }
              50% { width: 55%; margin-left: 22%; }
              100% { width: 0%; margin-left: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Error State */}
      {hasError && !isLoading && (
        <div style={{
          display: 'flex',
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h3 style={{ color: '#ffffff' }}>ไม่สามารถโหลดหน้าแดชบอร์ดการผลิตได้</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', textAlign: 'center' }}>
            กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต หรือตั้งค่า URL ใหม่ในหน้า Settings (ช่อง CH 20)
          </p>
        </div>
      )}

      {/* Production Dashboard iframe — loads the original TV-Present dashboard directly */}
      <iframe
        ref={iframeRef}
        src={apiUrl}
        title="SMW Production Dashboard"
        onLoad={handleIframeLoad}
        onError={handleIframeError}
        allow="autoplay; fullscreen"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px',
          display: isLoading || hasError ? 'none' : 'block',
          background: '#0a0a0a'
        }}
      />
    </div>
  );
}
