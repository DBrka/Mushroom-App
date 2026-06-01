import { ArrowLeft, Home, Utensils, Ban, Skull, ExternalLink, BookOpen, Leaf, ChevronRight, HelpCircle } from 'lucide-react';
import { Mushroom, MONTHS_SR } from '../../data/mushrooms';
import { IdentificationSuggestion } from './Identify';

interface IdentificationResultProps {
  results: IdentificationSuggestion[];
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
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: '#e7e5e4' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value * 100}%`, background: accent }} />
      </div>
      <span className="text-xs font-bold w-9 text-right" style={{ color: accent }}>{Math.round(value * 100)}%</span>
    </div>
  );
}

// Kartica za jedan rezultat koji NIJE u našoj bazi
function UnknownCard({ result, rank }: { result: IdentificationSuggestion; rank: number }) {
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(result.latinName + ' mushroom')}`;
  const imagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(result.latinName)}`;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e7e5e4' }}>
      {rank === 0 && (
        <div className="px-4 pt-3 pb-1">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#f0fdf4', color: '#166534' }}>
            #1 BEST MATCH
          </span>
        </div>
      )}

      <div className="p-4 flex gap-3 items-center">
        {/* Placeholder slika */}
        <div className="size-16 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#f1f5f9' }}>
          <HelpCircle className="size-7" style={{ color: '#94a3b8' }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-bold text-base italic truncate" style={{ color: '#1c1917' }}>{result.latinName}</p>
          <p className="text-xs mt-0.5 mb-2" style={{ color: '#94a3b8' }}>Nije u našoj bazi</p>
          <ConfidenceBar value={result.confidence} accent="#475569" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <a href={googleUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#f1f5f9', color: '#475569' }}>
          <ExternalLink className="size-3.5" /> Info
        </a>
        <a href={imagesUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: '#166534', color: 'white' }}>
          <ExternalLink className="size-3.5" /> Slike
        </a>
      </div>
    </div>
  );
}

// Kartica za jedan rezultat koji JE u našoj bazi
function KnownCard({ result, rank, onDetail }: { result: IdentificationSuggestion; rank: number; onDetail: () => void }) {
  const m = result.localMushroom!;
  const cfg = categoryConfig[m.category];
  const googleImagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(m.name + ' ' + m.latinName)}`;

  if (rank === 0) {
    // Prikaz za #1 rezultat — veći
    return (
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden" style={{ border: '1px solid #e7e5e4' }}>
        <div className="px-4 pt-3 pb-2 flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: '#f0fdf4', color: '#166534' }}>
            #1 BEST MATCH
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            <cfg.Icon className="size-3" /> {cfg.label}
          </span>
        </div>

        {/* Slika */}
        <div className="relative h-48 mx-4 rounded-2xl overflow-hidden">
          <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-white text-xl font-bold">{m.name}</h2>
            <p className="text-white/70 italic text-sm">{result.latinName}</p>
          </div>
        </div>

        {/* Confidence */}
        <div className="px-4 py-3">
          <ConfidenceBar value={result.confidence} accent={cfg.accent} />
        </div>

        {/* Sezona */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Leaf className="size-3.5" style={{ color: '#166534' }} />
            <p className="text-xs font-semibold" style={{ color: '#1c1917' }}>Sezona berbe</p>
          </div>
          <div className="grid grid-cols-12 gap-0.5">
            {MONTHS_SR.map((month, i) => (
              <div key={month} className="flex flex-col items-center gap-0.5">
                <div className="h-5 w-full rounded"
                  style={m.activeMonths.includes(i + 1) ? { background: cfg.accent } : { background: '#f1f5f9' }} />
                <span style={{ color: '#a8a29e', fontSize: '8px' }}>{month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Klobuk + Stanište + Jestivost */}
        <div className="border-t border-stone-100 mx-4">
          {[{ label: 'Klobuk', value: m.cap }, { label: 'Stanište', value: m.habitat }, { label: 'Jestivost', value: m.edibility }]
            .map(({ label, value }, idx) => (
              <div key={label} className={`py-3 ${idx > 0 ? 'border-t border-stone-100' : ''}`}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#a8a29e' }}>{label}</p>
                <p className="text-sm leading-relaxed" style={{ color: '#44403c' }}>{value}</p>
              </div>
            ))}
        </div>

        {/* Upozorenja */}
        {m.category === 'smrtonosna' && (
          <div className="mx-4 mb-3 rounded-xl p-3 border-2 flex gap-2 items-start" style={{ background: '#fff1f2', borderColor: '#fca5a5' }}>
            <Skull className="size-4 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-xs" style={{ color: '#7f1d1d' }}><strong>SMRTONOSNO OPASNA!</strong> Odmah potražite ljekarsku pomoć ako je konzumirana.</p>
          </div>
        )}
        {m.category === 'nejestiva' && (
          <div className="mx-4 mb-3 rounded-xl p-3 border-2 flex gap-2 items-start" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
            <Ban className="size-4 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
            <p className="text-xs" style={{ color: '#78350f' }}><strong>Nije jestiva.</strong> Konzumacija može izazvati trovanje.</p>
          </div>
        )}

        {/* Dugmad */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <button onClick={onDetail}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm"
            style={{ background: '#f0fdf4', color: '#166534', border: '1.5px solid #bbf7d0' }}>
            <BookOpen className="size-4" /> Detalji
          </button>
          <a href={googleImagesUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 rounded-2xl font-medium text-sm"
            style={{ background: '#166534', color: 'white' }}>
            <ExternalLink className="size-4" /> Google slike
          </a>
        </div>
      </div>
    );
  }

  // Kompaktni prikaz za #2–5
  return (
    <button onClick={onDetail} className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-98"
      style={{ background: 'white', border: '1px solid #e7e5e4' }}>
      <div className="size-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: '#f1f5f9', color: '#475569' }}>{rank + 1}</div>
      <div className="size-14 rounded-xl overflow-hidden flex-shrink-0">
        <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="font-semibold text-sm truncate" style={{ color: '#1c1917' }}>{m.name}</p>
          <div className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-xs"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            <cfg.Icon className="size-2.5" />
          </div>
        </div>
        <p className="text-xs italic truncate mb-1.5" style={{ color: '#78716c' }}>{result.latinName}</p>
        <ConfidenceBar value={result.confidence} accent={cfg.accent} />
      </div>
      <ChevronRight className="size-4 flex-shrink-0" style={{ color: '#cbd5e1' }} />
    </button>
  );
}

// Kompaktni prikaz za alternativne rezultate bez lokalne baze
function UnknownCompact({ result, rank }: { result: IdentificationSuggestion; rank: number }) {
  const imagesUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(result.latinName)}`;
  return (
    <a href={imagesUrl} target="_blank" rel="noopener noreferrer"
      className="w-full flex items-center gap-3 p-3 rounded-2xl"
      style={{ background: 'white', border: '1px solid #e7e5e4' }}>
      <div className="size-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{ background: '#f1f5f9', color: '#475569' }}>{rank + 1}</div>
      <div className="size-14 rounded-xl flex-shrink-0 flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <HelpCircle className="size-6" style={{ color: '#94a3b8' }} />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm italic truncate" style={{ color: '#1c1917' }}>{result.latinName}</p>
        <p className="text-xs mb-1.5" style={{ color: '#94a3b8' }}>Nije u bazi — klikni za Google slike</p>
        <ConfidenceBar value={result.confidence} accent="#94a3b8" />
      </div>
      <ExternalLink className="size-4 flex-shrink-0" style={{ color: '#cbd5e1' }} />
    </a>
  );
}

// ── Glavni ekran ──────────────────────────────────────────────────────────────
export function IdentificationResult({ results, onBack, onHome, onDetail }: IdentificationResultProps) {
  const top = results[0];
  const alternatives = results.slice(1);

  return (
    <div className="size-full flex flex-col" style={{ background: '#f8f7f4' }}>

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 shadow-sm px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="size-9 flex items-center justify-center rounded-xl" style={{ background: '#f1f5f9' }}>
            <ArrowLeft className="size-5" style={{ color: '#475569' }} />
          </button>
          <div>
            <h2 className="text-xl font-bold leading-tight" style={{ color: '#1c1917' }}>Rezultati identifikacije</h2>
            <p className="text-xs" style={{ color: '#a8a29e' }}>
              mushroom.id • {results.length} prijedloga
              {results.filter(r => r.localMushroom).length > 0 &&
                ` • ${results.filter(r => r.localMushroom).length} u našoj bazi`}
            </p>
          </div>
        </div>
        <button onClick={onHome} className="size-9 flex items-center justify-center rounded-xl" style={{ background: '#f1f5f9' }}>
          <Home className="size-5" style={{ color: '#475569' }} />
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-lg mx-auto p-5 space-y-4">

          {/* Glavni rezultat */}
          {top.localMushroom
            ? <KnownCard result={top} rank={0} onDetail={() => onDetail(top.localMushroom!)} />
            : <UnknownCard result={top} rank={0} />
          }

          {/* Alternativni rezultati */}
          {alternatives.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide mb-2 px-1" style={{ color: '#a8a29e' }}>
                Ostale mogućnosti
              </p>
              <div className="space-y-2">
                {alternatives.map((r, idx) =>
                  r.localMushroom
                    ? <KnownCard key={idx} result={r} rank={idx + 1} onDetail={() => onDetail(r.localMushroom!)} />
                    : <UnknownCompact key={idx} result={r} rank={idx + 1} />
                )}
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
