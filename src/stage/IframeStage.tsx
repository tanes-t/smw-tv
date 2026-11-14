import { memo, useEffect, useRef } from 'react';

function IframeStage({ url }: { url: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    return () => {
      // คืนหน่วยความจำของเอกสารที่โหลดอยู่ก่อนถอด iframe ออกจาก DOM
      if (frame) {
        frame.src = 'about:blank';
        frame.removeAttribute('src');
      }
    };
  }, []);

  return (
    <iframe
      ref={ref}
      className="stage-frame"
      src={url}
      title="stage"
      tabIndex={-1}
      referrerPolicy="no-referrer"
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
    />
  );
}

export default memo(IframeStage);
