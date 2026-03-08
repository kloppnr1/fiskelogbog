import { useEffect, useCallback } from 'react';
import { useSwipe } from './PhotoCarousel';

export interface LightboxProps {
  photos: string[] | null;
  idx: number;
  onClose: () => void;
  onChange: (i: number) => void;
}

export function Lightbox({ photos, idx, onClose, onChange }: LightboxProps) {
  const count = photos?.length || 0;
  const prev = useCallback(() => onChange((idx - 1 + count) % count), [idx, count, onChange]);
  const next = useCallback(() => onChange((idx + 1) % count), [idx, count, onChange]);
  const swipe = useSwipe(next, prev);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose, prev, next]);

  if (!photos || count === 0) return null;
  const src = photos[idx];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex items-center justify-center animate-fade-in"
      onClick={onClose}
      {...swipe}
    >
      <img src={src} alt="" className="max-w-[94vw] max-h-[94vh] rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />

      {count > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/25 hover:text-white flex items-center justify-center transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm text-white/70 hover:bg-white/25 hover:text-white flex items-center justify-center transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); onChange(i); }}
                className={`h-2 rounded-full transition-all ${
                  i === idx ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/60 w-2'
                }`}
              />
            ))}
          </div>

          <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
            {idx + 1} / {count}
          </div>
        </>
      )}

      <button className="absolute top-5 right-6 text-white/50 hover:text-white text-2xl transition-colors" onClick={onClose}>&#x2715;</button>
    </div>
  );
}
