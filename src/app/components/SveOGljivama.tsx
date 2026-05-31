import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';

type View = 'home' | 'identify' | 'library' | 'detail' | 'result' | 'intro' | 'literatura';

interface SveOGljivamaProps {
  onBack: () => void;
}

const pages = [
  '/literatura/20260518_222419.jpg',
  '/literatura/20260518_222447.jpg',
  '/literatura/20260518_222459.jpg',
  '/literatura/20260518_222514.jpg',
  '/literatura/20260518_222528.jpg',
  '/literatura/20260518_222541.jpg',
  '/literatura/20260518_222601.jpg',
  '/literatura/20260518_222615.jpg',
  '/literatura/20260518_222632.jpg',
  '/literatura/20260518_222644.jpg',
  '/literatura/20260518_222656.jpg',
  '/literatura/20260518_222726.jpg',
  '/literatura/20260518_222740.jpg',
  '/literatura/20260518_222800.jpg',
  '/literatura/20260518_222816.jpg',
  '/literatura/20260518_222841.jpg',
  '/literatura/20260518_223659.jpg',
  '/literatura/20260518_223751.jpg',
  '/literatura/20260518_223803.jpg',
  '/literatura/20260518_223818.jpg',
  '/literatura/20260518_223832.jpg',
  '/literatura/20260518_223848.jpg',
  '/literatura/20260518_223900.jpg',
  '/literatura/20260518_223917.jpg',
  '/literatura/20260518_223930.jpg',
  '/literatura/20260518_224007.jpg',
  '/literatura/20260518_224037.jpg',
  '/literatura/20260518_224108.jpg',
  '/literatura/20260518_224123.jpg',
  '/literatura/20260518_224139.jpg',
  '/literatura/20260518_224156.jpg',
  '/literatura/20260518_224210.jpg',
  '/literatura/20260518_224224.jpg',
  '/literatura/20260518_224240.jpg',
  '/literatura/20260518_224334.jpg',
  '/literatura/20260518_224402.jpg',
  '/literatura/20260518_224419.jpg',
  '/literatura/20260518_224437.jpg',
  '/literatura/20260518_224502.jpg',
  '/literatura/20260518_224521.jpg',
  '/literatura/20260518_224558.jpg',
  '/literatura/20260518_224611.jpg',
  '/literatura/20260518_224626.jpg',
  '/literatura/20260518_224639.jpg',
  '/literatura/20260518_224654.jpg',
  '/literatura/20260518_224707.jpg',
  '/literatura/20260518_224722.jpg',
  '/literatura/20260518_224737.jpg',
  '/literatura/20260518_224752.jpg',
  '/literatura/20260519_013944.jpg',
  '/literatura/20260519_013953.jpg',
  '/literatura/20260519_014005.jpg',
];

export function SveOGljivama({ onBack }: SveOGljivamaProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [touch, setTouch] = useState<number | null>(null);

  const prev = () => setCurrent(c => Math.max(0, c - 1));
  const next = () => setCurrent(c => Math.min(pages.length - 1, c + 1));

  const lightboxPrev = () => setLightbox(l => (l !== null ? Math.max(0, l - 1) : null));
  const lightboxNext = () => setLightbox(l => (l !== null ? Math.min(pages.length - 1, l + 1) : null));

  // Swipe support
  const handleTouchStart = (e: React.TouchEvent) => setTouch(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent, onPrev: () => void, onNext: () => void) => {
    if (touch === null) return;
    const diff = touch - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? onNext() : onPrev();
    setTouch(null);
  };

  // Thumbnail grid: show 6 per "page"
  const THUMB_PAGE = 6;
  const thumbStart = Math.floor(current / THUMB_PAGE) * THUMB_PAGE;

  return (
    <div className="size-full flex flex-col" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
        <button onClick={onBack}
          className="size-9 rounded-full flex items-center justify-center transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <ArrowLeft className="size-5 text-white" />
        </button>
        <div>
          <h1 className="text-white font-bold text-lg leading-tight">Sve o gljivama</h1>
          <p className="text-white/70 text-xs">Literatura · {pages.length} stranica</p>
        </div>
        <div className="ml-auto text-white/60 text-sm font-medium">{current + 1} / {pages.length}</div>
      </div>

      {/* Main viewer */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-4 pb-2 gap-3">

        {/* Large current image */}
        <div
          className="flex-1 rounded-2xl overflow-hidden shadow-xl relative cursor-pointer min-h-0"
          style={{ border: '2px solid #bbf7d0', background: '#0d2b1a' }}
          onClick={() => setLightbox(current)}
          onTouchStart={handleTouchStart}
          onTouchEnd={e => handleTouchEnd(e, prev, next)}
        >
          <img
            key={pages[current]}
            src={pages[current]}
            alt={`Stranica ${current + 1}`}
            className="w-full h-full object-contain"
            style={{ display: 'block' }}
          />
          {/* Zoom hint */}
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-full text-xs text-white/70"
            style={{ background: 'rgba(0,0,0,0.4)' }}>
            Dodirnite za povećanje
          </div>
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={prev}
            disabled={current === 0}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30"
            style={{ background: current === 0 ? '#e2e8f0' : 'white', border: '1.5px solid #bbf7d0', color: '#14532d' }}>
            <ChevronLeft className="size-5" /> Prethodna
          </button>
          <button
            onClick={next}
            disabled={current === pages.length - 1}
            className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30"
            style={{ background: current === pages.length - 1 ? '#e2e8f0' : 'linear-gradient(135deg, #14532d 0%, #166534 100%)', color: 'white', border: '1.5px solid transparent' }}>
            Sljedeća <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Thumbnail strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0"
          style={{ scrollbarWidth: 'none' }}>
          {pages.map((p, i) => (
            <button
              key={p}
              onClick={() => setCurrent(i)}
              className="flex-shrink-0 rounded-lg overflow-hidden transition-all active:scale-95"
              style={{
                width: 52, height: 52,
                border: i === current ? '2.5px solid #16a34a' : '2px solid #bbf7d0',
                opacity: i === current ? 1 : 0.7,
                boxShadow: i === current ? '0 0 0 2px rgba(22,163,74,0.3)' : 'none',
              }}>
              <img src={p} alt={`Str ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.95)' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={e => handleTouchEnd(e, lightboxPrev, lightboxNext)}
        >
          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 size-10 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X className="size-6 text-white" />
          </button>

          {/* Page counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-white text-sm"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            {lightbox + 1} / {pages.length}
          </div>

          {/* Prev arrow */}
          {lightbox > 0 && (
            <button onClick={lightboxPrev}
              className="absolute left-3 size-11 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <ChevronLeft className="size-7 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            key={pages[lightbox]}
            src={pages[lightbox]}
            alt={`Stranica ${lightbox + 1}`}
            className="max-w-full max-h-full object-contain"
            style={{ padding: '48px 56px' }}
          />

          {/* Next arrow */}
          {lightbox < pages.length - 1 && (
            <button onClick={lightboxNext}
              className="absolute right-3 size-11 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.15)' }}>
              <ChevronRight className="size-7 text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
