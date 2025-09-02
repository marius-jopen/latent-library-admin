"use client";

import { useEffect } from 'react';

export function Lightbox({ src, alt, onClose, onPrev, onNext }: { src: string; alt: string; onClose: () => void; onPrev?: () => void; onNext?: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev?.();
      if (e.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 backdrop-blur bg-black/60" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="max-w-[95vw] max-h-[90vh] rounded-md shadow-2xl" />
        <button className="absolute top-4 right-4 text-white/90 hover:text-white" onClick={onClose} aria-label="Close">✕</button>
        {onPrev ? (
          <button className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white" onClick={onPrev} aria-label="Previous">←</button>
        ) : null}
        {onNext ? (
          <button className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white" onClick={onNext} aria-label="Next">→</button>
        ) : null}
      </div>
    </div>
  );
}

export default Lightbox;


