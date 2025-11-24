"use client";

import { useEffect, useRef, useState } from 'react';

type LazyImageProps = {
  src: string;
  alt: string;
  className?: string;
  fit?: 'cover' | 'contain';
  placeholderSrc?: string;
};

export function LazyImage({ src, alt, className, fit = 'cover', placeholderSrc }: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [srcToShow, setSrcToShow] = useState<string | null>(null);
  const [isHighLoaded, setIsHighLoaded] = useState(false);

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
    <div ref={containerRef} className={`${className || ''} relative`}>
      {placeholderSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={placeholderSrc}
          alt=""
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${isHighLoaded ? 'opacity-0' : 'opacity-100'} blur-sm`}
        />
      ) : null}
      {isVisible && srcToShow ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={srcToShow}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setIsHighLoaded(true)}
          className={`absolute inset-0 w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-300 ${isHighLoaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : null}
    </div>
  );
}

export default LazyImage;


