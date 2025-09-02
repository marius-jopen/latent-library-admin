"use client";

import { useEffect, useRef, useState } from 'react';

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
};

export function LazyImage({ src, alt, className }: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      ) : null}
    </div>
  );
}

export default LazyImage;


