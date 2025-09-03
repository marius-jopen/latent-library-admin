"use client";

import { useEffect, useRef, useState } from 'react';

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  fit?: 'cover' | 'contain';
};

export function LazyImage({ src, alt, className, fit = 'cover' }: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [srcToShow, setSrcToShow] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsVisible(true);
          setSrcToShow(src);
          io.disconnect();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible && srcToShow ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={srcToShow}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`w-full h-auto ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        />
      ) : null}
    </div>
  );
}

export default LazyImage;


