import { ArrowLeft, Home, Utensils, Ban, Skull, ExternalLink, BookOpen, Leaf, ChevronRight } from 'lucide-react';
import { Mushroom, MONTHS_SR } from '../../data/mushrooms';

interface IdentificationResultProps {
  mushrooms: Mushroom[];
  onBack: () => void;
  onHome: () => void;
  onDetail: (mushroom: Mushroom) => void;
}

const categoryConfig = {
  jestiva:    { Icon: Utensils, label: 'Jestiva',    color: '#166534', bg: '#dcfce7', border: '#86efac', accent: '#166534' },
  nejestiva:  { Icon: Ban,     label: 'Nejestiva',   color: '#92400e', bg: '#fef3c7', border: '#fcd34d', accent: '#b45309' },
  smrtonosna: { Icon: Skull,   label: 'Smrtonosna',  color: '#991b1b', bg: '#fee2e2', border: '#fca5a5', accent: '#dc2626' },
};

function ConfidenceBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: '#e7e5e4' }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: accent }} />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color: accent }}>{pct}%</span>
    </div>
  );
}

export function IdentificationResult({ mushrooms, onBack, onHome, onDetail }: IdentificationResultProps) {
  const top = mushrooms[0];
  const alternatives = mushrooms.slice(1);
  const cfg = categoryConfig[top.category];
  const { Icon } = cfg;

  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(top.name + ' ' + top.latinName)}`;

  return (
    <div className="size-full flex flex-col" style={{ background: '#f8f7f4' }}>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack}
            className="size-9 flex items-center justify-center rounded-xl"
            style={{ background: '#f1f5f9' }}>
            <ArrowLeft className="size-5" style={{ color: '#475569' }} />
          </button>
          <div>
            <h2 className="text-xl font-bold leading-tight" style={{ color: '#1c1917' }}>Rezultati identifikacije</h2>
            <p className="text-xs" style={{ color: '#a8a29e' }}>{mushrooms.length} potencijalnih vrsta</p>
          </div>
        </div>
        <button onClick={onHome}
          className="size-9 flex items-center justify-center rounded-xl"
          style={{ background: '#f1f5f9' }}>
          <Home className="size-5" style={{ color: '#475569' }} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-5 space-y-4">

          {/* ── BEST MATCH ─────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden" style={{ background: 'white', border: '1px solid #e7e5e4', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

            {/* Badge */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-2">
              <div className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide"
                style={{ background: '#f0fdf4', color: '#166534' }}>
                #1 BEST MATCH
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
                style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
                <Icon className="size-3" />
                {cfg.label}
              </div>
            </div>

            {/* Image */}
            <div className="relative h-52 mx-4 rounded-2xl overflow-hidden">
              <img src={top.image} alt={top.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.7) 100%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h1 className="text-white text-xl font-bold leading-tight">{top.name}</h1>
                <p className="text-white/70 italic text-sm mt-0.5">{top.latinName}</p>
              </div>
            </div>

            {/* Confidence */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#78716c' }}>Pouzdanost</p>
              </div>
              <ConfidenceBar value={top.confidence} accent={cfg.accent} />
            </div>

            {/* Season */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Leaf className="size-3.5" style={{ color: '#166534' }} />
                <p className="text-xs font-semibold" style={{ color: '#1c1917' }}>Sezona berbe</p>
              </div>
              <div className="grid grid-cols-12 gap-0.5">
                {MONTHS_SR.map((month, i) => {
                  const active = top.activeMonths.includes(i + 1);
                  return (
                    <div key={month} className="flex flex-col items-center gap-0.5">
                      <div className="h-5 w-full rounded"
                        style={active ? { background: cfg.accent } : { background: '#f1f5f9' }} />
                      <span style={{ color: '#a8a29e', fontSize: '8px' }}>{month}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Key info */}
            <div className="border-t border-stone-100 mx-4">
              {[
                { label: 'Klobuk', value: top.cap },
                { label: 'Stanište', value: top.habitat },
                { label: 'Jestivost', value: top.edibility },
              ].map(({ label, value }, idx) => (
                <div key={label} className={`py-3 ${idx > 0 ? 'border-t border-stone-100' : ''}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#a8a29e' }}>{label}</p>
                  <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Warning */}
            {top.category === 'smrtonosna' && (
              <div className="mx-4 mb-3 rounded-xl p-3 border-2 flex gap-2 items-start" style={{ background: '#fff1f2', borderColor: '#fca5a5' }}>
                <Skull className="size-4 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#7f1d1d' }}>
                  <strong>SMRTONOSNO OPASNA!</strong> Odmah potražite ljekarsku pomoć ako je konzumirana.
                </p>
              </div>
            )}
            {top.category === 'nejestiva' && (
              <div className="mx-4 mb-3 rounded-xl p-3 border-2 flex gap-2 items-start" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
                <Ban className="size-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
                <p className="text-xs leading-relaxed" style={{ color: '#78350f' }}>
                  <strong>Nije jestiva.</strong> Konzumacija može izazvati trovanje.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 px-4 pb-4">
              <button onClick={() => onDetail(top)}
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{ background: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0' }}>
                <BookOpen className="size-4" />
                Detalji
              </button>
              <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm transition-all active:scale-95"
                style={{ background: '#166534', color: 'white' }}>
                <ExternalLink className="size-4" />
                Google slike
              </a>
            </div>
          </div>

          {/* ── ALTERNATIVE MATCHES ────────────────────────── */}
          {alternatives.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 px-1" style={{ color: '#a8a29e' }}>
                Ostale mogućnosti
              </p>
              <div className="space-y-2">
                {alternatives.map((m, idx) => {
                  const c = categoryConfig[m.category];
                  return (
                    <button key={m.id} onClick={() => onDetail(m)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98"
                      style={{ background: 'white', border: '1px solid #e7e5e4' }}>

                      {/* Rank */}
                      <div className="size-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: '#f1f5f9', color: '#475569' }}>
                        {idx + 2}
                      </div>

                      {/* Thumbnail */}
                      <div className="size-14 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="font-semibold text-sm truncate" style={{ color: '#1c1917' }}>{m.name}</p>
                          <div className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs"
                            style={{ color: c.color, background: c.bg, borderColor: c.border }}>
                            <c.Icon className="size-2.5" />
                          </div>
                        </div>
                        <p className="text-xs italic truncate mb-1.5" style={{ color: '#78716c' }}>{m.latinName}</p>
                        <ConfidenceBar value={m.confidence} accent={c.accent} />
                      </div>

                      <ChevronRight className="size-4 flex-shrink-0" style={{ color: '#cbd5e1' }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="rounded-xl p-4 text-center" style={{ background: '#fafaf9' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
              Identifikacija je generisana algoritmom i može biti netačna. Uvijek konsultujte
              stručnjaka za mikologiju prije konzumiranja divljih gljiva.
            </p>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
