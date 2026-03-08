import { useState, useRef, useCallback } from 'react';
import { IconCamera } from './Icons';

/** Shared swipe hook */
function useSwipe(onLeft: () => void, onRight: () => void, threshold = 50) {
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = true;
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    if (Math.abs(dx) < threshold || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) onLeft();
    else onRight();
  }, [onLeft, onRight, threshold]);

  return { onTouchStart, onTouchEnd };
}

export { useSwipe };

interface Props {
  photos: string[];
  coverPhoto?: string;
  onPhoto: (src: string, idx: number) => void;
}

export function PhotoCarousel({ photos, coverPhoto, onPhoto }: Props) {
  const coverIdx = coverPhoto ? photos.indexOf(coverPhoto) : -1;
  const [idx, setIdx] = useState(coverIdx >= 0 ? coverIdx : 0);
  const [isPortrait, setIsPortrait] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const count = photos.length;
  
  if (count === 0) return null;
  
  const prev = useCallback(() => setIdx(i => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx(i => (i + 1) % count), [count]);
  const swipe = useSwipe(next, prev);
  const src = `photos/${photos[idx]}`;

  const handleLoad = () => {
    const img = imgRef.current;
    if (img) {
      setIsPortrait(img.naturalHeight > img.naturalWidth);
    }
  };

  return (
    <div
      className={`relative overflow-hidden group/carousel bg-slate-100 ${
        isPortrait ? 'aspect-[3/4] max-h-[480px]' : 'aspect-[16/10]'
      } transition-[aspect-ratio] duration-300`}
      {...swipe}
    >
      <img
        ref={imgRef}
        src={src}
        alt=""
        loading="lazy"
        onLoad={handleLoad}
        className={`w-full h-full cursor-pointer transition-transform duration-500 ${
          isPortrait ? 'object-contain' : 'object-cover'
        }`}
        onClick={() => onPhoto(src, idx)}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
      
      {count > 1 && (
        <>
          {/* Prev/Next */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/25 backdrop-blur-sm text-white/80 hover:bg-black/50 hover:text-white flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          
          {/* Dots */}
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'bg-white w-4' : 'bg-white/40 hover:bg-white/70 w-1.5'
                }`}
              />
            ))}
          </div>
          
          {/* Counter */}
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <IconCamera className="w-3 h-3" />
            {idx + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
