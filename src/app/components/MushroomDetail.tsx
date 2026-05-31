import { useState } from 'react';
import { ArrowLeft, Utensils, Ban, Skull, MapPin, Leaf, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Mushroom, MONTHS_SR } from '../../data/mushrooms';

interface MushroomDetailProps {
  mushroom: Mushroom;
  onBack: () => void;
}

const categoryConfig = {
  jestiva:    { icon: Utensils, label: 'Jestiva',    color: '#166534', bg: '#dcfce7', border: '#86efac', activeBg: '#166534' },
  nejestiva:  { icon: Ban,      label: 'Nejestiva',  color: '#92400e', bg: '#fef3c7', border: '#fcd34d', activeBg: '#b45309' },
  smrtonosna: { icon: Skull,    label: 'Smrtonosna', color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', activeBg: '#dc2626' },
};

const fieldLabels: { key: keyof Mushroom; label: string }[] = [
  { key: 'cap',       label: 'Klobuk'    },
  { key: 'gills',     label: 'Listići'   },
  { key: 'stem',      label: 'Drška'     },
  { key: 'flesh',     label: 'Meso'      },
  { key: 'spores',    label: 'Spore'     },
  { key: 'edibility', label: 'Jestivost' },
  { key: 'notes',     label: 'Napomene'  },
];

export function MushroomDetail({ mushroom, onBack }: MushroomDetailProps) {
  const cfg = categoryConfig[mushroom.category];
  const Icon = cfg.icon;

  // Use images array if available, otherwise fall back to single image
  const allImages: string[] = mushroom.images && mushroom.images.length > 0
    ? mushroom.images
    : [mushroom.image];

  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const openLightbox = (idx: number) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  };

  const lightboxPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length);
  };

  const lightboxNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLightboxIdx(i => (i + 1) % allImages.length);
  };

  return (
    <div className="size-full flex flex-col bg-stone-50">

      {/* Hero image */}
      <div className="relative h-60 flex-shrink-0">
        <img
          src={allImages[activeIdx]}
          alt={mushroom.name}
          className="w-full h-full object-cover cursor-pointer"
          onClick={() => openLightbox(activeIdx)}
        />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)' }} />

        {/* Back button */}
        <button onClick={onBack}
          className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="size-5 text-white" />
        </button>

        {/* Image counter */}
        {allImages.length > 1 && (
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full text-xs text-white font-medium"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
            {activeIdx + 1} / {allImages.length}
          </div>
        )}

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <h1 className="text-white text-xl font-semibold leading-tight">{mushroom.name}</h1>
          <p className="text-white/70 italic text-sm mt-0.5">{mushroom.latinName}</p>
        </div>
      </div>

      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex-shrink-0 bg-black">
          <div className="flex gap-1 p-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {allImages.map((src, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className="flex-shrink-0 rounded overflow-hidden transition-all active:scale-95"
                style={{
                  width: 56,
                  height: 44,
                  outline: i === activeIdx ? '2px solid #4ade80' : '2px solid transparent',
                  outlineOffset: 0,
                  opacity: i === activeIdx ? 1 : 0.55,
                }}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          {/* Category badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            <Icon className="size-4" />
            {cfg.label}
          </div>

          {/* Season calendar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="size-4 text-emerald-600" />
              <span className="text-stone-700 font-medium text-sm">Sezona berbe</span>
            </div>
            <div className="grid grid-cols-12 gap-0.5">
              {MONTHS_SR.map((month, i) => {
                const active = mushroom.activeMonths.includes(i + 1);
                return (
                  <div key={month} className="flex flex-col items-center gap-1">
                    <div className="rounded h-7 w-full flex items-center justify-center text-xs font-bold transition-colors"
                      style={active
                        ? { background: cfg.activeBg, color: 'white' }
                        : { background: '#f1f5f9', color: '#94a3b8' }}>
                      {active ? '●' : ''}
                    </div>
                    <span className="text-xs text-stone-400 leading-none" style={{ fontSize: 9 }}>{month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="size-3 rounded" style={{ background: '#166534' }} />
              <span className="text-xs text-stone-500">Aktivna sezona</span>
            </div>
          </div>

          {/* Description fields */}
          <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
            {fieldLabels.map(({ key, label }, idx) => {
              const val = mushroom[key];
              if (!val || typeof val !== 'string') return null;
              return (
                <div key={key} className={idx > 0 ? 'border-t border-stone-100' : ''}>
                  <div className="px-4 py-3.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">{label}</p>
                    <p className="text-stone-700 text-sm leading-relaxed">{val}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Habitat */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex gap-3 items-start">
            <MapPin className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Stanište</p>
              <p className="text-stone-700 text-sm leading-relaxed">{mushroom.habitat}</p>
            </div>
          </div>

          {/* Warning for dangerous mushrooms */}
          {mushroom.category === 'smrtonosna' && (
            <div className="rounded-2xl p-4 border-2" style={{ background: '#fff1f2', borderColor: '#fca5a5' }}>
              <div className="flex gap-3 items-start">
                <Skull className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#991b1b' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>
                  <strong>OPASNOST:</strong> Ova gljiva je smrtonosno otrovana. Nikada je ne konzumirajte.
                  Čak i mali dijelovi mogu uzrokovati zatajenje organa. U slučaju kontakta odmah potražite ljekarsku pomoć.
                </p>
              </div>
            </div>
          )}

          {mushroom.category === 'nejestiva' && (
            <div className="rounded-2xl p-4 border-2" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
              <div className="flex gap-3 items-start">
                <Ban className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>
                  <strong>UPOZORENJE:</strong> Ova gljiva nije jestiva i može izazvati trovanje ili
                  ozbiljne zdravstvene probleme. Ne konzumirajte je.
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc' }}>
            <p className="text-xs text-stone-500 leading-relaxed">
              Ova aplikacija služi isključivo u obrazovne svrhe. Nikada ne konzumirajte
              gljive bez provjere stručnjaka za mikologiju.
            </p>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.97)' }}
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            onClick={() => setLightboxOpen(false)}>
            <X className="size-6 text-white" />
          </button>

          {/* Title */}
          <div className="absolute top-4 left-0 right-0 text-center pointer-events-none px-16">
            <p className="text-white font-semibold text-sm">{mushroom.name}</p>
            <p className="text-white/50 italic text-xs mt-0.5">{mushroom.latinName}</p>
          </div>

          {/* Counter */}
          <div className="absolute top-14 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/50 text-xs">{lightboxIdx + 1} / {allImages.length}</p>
          </div>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              className="absolute left-3 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onClick={lightboxPrev}>
              <ChevronLeft className="size-6 text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={allImages[lightboxIdx]}
            alt={mushroom.name}
            className="max-w-full max-h-full object-contain"
            style={{ padding: '72px 60px 20px' }}
            onClick={e => e.stopPropagation()}
          />

          {/* Next */}
          {allImages.length > 1 && (
            <button
              className="absolute right-3 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
              style={{ background: 'rgba(255,255,255,0.12)' }}
              onClick={lightboxNext}>
              <ChevronRight className="size-6 text-white" />
            </button>
          )}

          {/* Thumbnail dots */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 flex-wrap px-8">
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                  className="rounded-full transition-all"
                  style={{
                    width: i === lightboxIdx ? 20 : 6,
                    height: 6,
                    background: i === lightboxIdx ? '#4ade80' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
