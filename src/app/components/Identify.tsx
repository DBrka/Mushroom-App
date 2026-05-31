import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import { mushrooms, Mushroom } from '../../data/mushrooms';

interface IdentifyProps {
  onIdentify: (mushrooms: Mushroom[]) => void;
  onBack: () => void;
}

// ── mushroom.id API ───────────────────────────────────────────────────────────
const MUSHROOMID_API_KEY = import.meta.env.VITE_MUSHROOMID_API_KEY ?? '';
const MUSHROOMID_URL     = 'https://mushroom.id/api/v2/identification';

interface MushroomIdSuggestion {
  name: string;           // latinski naziv npr. "Boletus edulis"
  probability: number;    // 0.0 – 1.0
  similar_images?: { url: string }[];
}

interface MushroomIdResponse {
  result: {
    is_mushroom?: { probability: number };
    classification: {
      suggestions: MushroomIdSuggestion[];
    };
  };
}

// Matchuje latinski naziv iz mushroom.id na našu bazu
function matchToDatabase(latinName: string): Mushroom | null {
  const needle = latinName.toLowerCase().trim();

  // 1. Egzaktan match
  const exact = mushrooms.find(m => m.latinName.toLowerCase() === needle);
  if (exact) return exact;

  // 2. Match na genus (prva riječ) + species (druga riječ)
  const parts = needle.split(' ');
  if (parts.length >= 2) {
    const genus   = parts[0];
    const species = parts[1];
    const partial = mushrooms.find(m => {
      const mParts = m.latinName.toLowerCase().split(' ');
      return mParts[0] === genus && mParts[1] === species;
    });
    if (partial) return partial;
  }

  // 3. Match samo na genus (npr. "Boletus" → prvi Boletus u bazi)
  if (parts.length >= 1) {
    const genus = parts[0];
    const genusMatch = mushrooms.find(m =>
      m.latinName.toLowerCase().startsWith(genus + ' ')
    );
    if (genusMatch) return genusMatch;
  }

  return null;
}

async function identifyWithMushroomId(imageDataUrl: string): Promise<Mushroom[]> {
  const response = await fetch(MUSHROOMID_URL, {
    method: 'POST',
    headers: {
      'Api-Key': MUSHROOMID_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: [imageDataUrl],        // šaljemo kompletni data URL
      similar_images: false,
      classification_level: 'species',
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.message ?? err?.error ?? response.statusText;
    if (response.status === 401 || response.status === 403) {
      throw new Error('INVALID_KEY');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMIT');
    }
    throw new Error(`mushroom.id greška ${response.status}: ${msg}`);
  }

  const data: MushroomIdResponse = await response.json();
  const suggestions = data?.result?.classification?.suggestions ?? [];

  if (suggestions.length === 0) {
    throw new Error('mushroom.id nije pronašao nijednu vrstu na slici.');
  }

  // Mapiraj suggestions na našu bazu
  const matched: Mushroom[] = [];
  const usedIds = new Set<number>();

  for (const s of suggestions) {
    if (matched.length >= 5) break;
    const found = matchToDatabase(s.name);
    if (found && !usedIds.has(found.id)) {
      usedIds.add(found.id);
      matched.push({
        ...found,
        confidence: Math.min(0.99, Math.max(0.01, s.probability)),
      });
    }
  }

  // Ako nema dovoljno matcheva iz naše baze, dodaj najbliže bez matchea
  // (prikaži barem 1 rezultat ako mushroom.id nešto pronađe)
  if (matched.length === 0) {
    throw new Error(
      `Identifikovane vrste nisu u našoj bazi (${suggestions.slice(0, 3).map(s => s.name).join(', ')}). Baza pokriva vrste Balkana.`
    );
  }

  return matched;
}

// ── Demo mode ─────────────────────────────────────────────────────────────────
function identifyDemo(): Mushroom[] {
  return [...mushrooms]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((m, i) => ({ ...m, confidence: Math.max(0.1, 0.85 - i * 0.15) }));
}

// ─────────────────────────────────────────────────────────────────────────────

export function Identify({ onIdentify, onBack }: IdentifyProps) {
  const [image, setImage]         = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [step, setStep]           = useState<string>('');

  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const hasApiKey = !!MUSHROOMID_API_KEY;

  const loadFile = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Molimo odaberite sliku (JPG, PNG, WEBP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Slika je prevelika. Maksimalna veličina je 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    setError(null);

    try {
      let results: Mushroom[];

      if (hasApiKey) {
        setStep('Pripremam sliku...');
        setStep('mushroom.id analizira sliku...');
        results = await identifyWithMushroomId(image);
      } else {
        setStep('Demo mod (nema API ključa)...');
        await new Promise(r => setTimeout(r, 1500));
        results = identifyDemo();
      }

      setAnalyzing(false);
      setStep('');
      onIdentify(results);

    } catch (err: any) {
      setAnalyzing(false);
      setStep('');
      const msg: string = err?.message ?? 'Nepoznata greška';

      if (msg === 'INVALID_KEY') {
        setError('Nevažeći mushroom.id API ključ. Provjeri VITE_MUSHROOMID_API_KEY u .env fajlu.');
      } else if (msg === 'RATE_LIMIT') {
        setError('Dostignut dnevni limit od 100 identifikacija. Nastavak sutra ili nadogradi plan na mushroom.id.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('Nema internet veze. Potrebna je mreža za identifikaciju.');
      } else {
        setError(`Greška: ${msg}`);
      }
    }
  };

  return (
    <div className="size-full flex flex-col" style={{ background: '#f8f7f4' }}>

      {/* Hidden inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={onBack}
          className="size-9 flex items-center justify-center rounded-xl"
          style={{ background: '#f1f5f9' }}>
          <ArrowLeft className="size-5" style={{ color: '#475569' }} />
        </button>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#1c1917' }}>Identifikacija gljive</h2>
          {hasApiKey
            ? <p className="text-xs font-medium" style={{ color: '#16a34a' }}>● mushroom.id aktivan</p>
            : <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>● Demo mod</p>
          }
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">

        {/* Upload zona */}
        {!image ? (
          <div className="rounded-3xl overflow-hidden"
            style={{ border: '2px dashed #bbf7d0', background: 'white' }}>
            <div className="flex flex-col items-center justify-center py-12 px-8 gap-5">
              <div className="size-20 rounded-2xl flex items-center justify-center"
                style={{ background: '#f0fdf4' }}>
                <Sparkles className="size-9" style={{ color: '#166534' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" style={{ color: '#1c1917' }}>Dodajte fotografiju gljive</p>
                <p className="text-sm mt-1" style={{ color: '#78716c' }}>
                  {hasApiKey
                    ? 'mushroom.id će identificirati vrstu gljive'
                    : 'Demo mod — dodaj API ključ za pravu identifikaciju'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>JPG, PNG, WEBP • maks. 10 MB</p>
              </div>

              <div className="flex gap-3 w-full max-w-xs">
                <button
                  onClick={() => cameraRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#166534', color: 'white' }}>
                  <Camera className="size-4" />
                  Kamera
                </button>
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#f0fdf4', color: '#166534', border: '1.5px solid #86efac' }}>
                  <ImageIcon className="size-4" />
                  Galerija
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* Preview slike */
          <div className="relative rounded-3xl overflow-hidden shadow-lg">
            <img src={image} alt="Odabrana fotografija" className="w-full max-h-80 object-cover" />
            <button
              onClick={() => { setImage(null); setError(null); }}
              className="absolute top-3 right-3 size-9 rounded-full flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <X className="size-5 text-white" />
            </button>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium active:scale-95"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                <Camera className="size-3.5" /> Nova
              </button>
              <button onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium active:scale-95"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                <ImageIcon className="size-3.5" /> Galerija
              </button>
            </div>
          </div>
        )}

        {/* Greška */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl"
            style={{ background: '#fff1f2', border: '1px solid #fca5a5' }}>
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-sm" style={{ color: '#7f1d1d' }}>{error}</p>
          </div>
        )}

        {/* Dugme za analizu */}
        {image && !analyzing && (
          <button onClick={handleAnalyze}
            className="w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
            <Sparkles className="size-5" />
            Identificiraj gljivu
          </button>
        )}

        {/* Loading */}
        {analyzing && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col items-center gap-4">
            <div className="size-16 rounded-2xl flex items-center justify-center"
              style={{ background: '#f0fdf4' }}>
              <Loader2 className="size-8 animate-spin" style={{ color: '#166534' }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: '#1c1917' }}>Analiziranje...</p>
              <p className="text-sm mt-1" style={{ color: '#78716c' }}>{step || 'Prepoznavanje vrste gljive'}</p>
            </div>
            <div className="w-full rounded-full overflow-hidden h-1.5" style={{ background: '#e7e5e4' }}>
              <div className="h-full rounded-full animate-pulse" style={{ background: '#166534', width: '65%' }} />
            </div>
          </div>
        )}

        {/* Obavještenje ako nema API ključa */}
        {!hasApiKey && !image && (
          <div className="rounded-2xl p-4" style={{ background: '#fffbeb', border: '1px solid #fcd34d' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: '#92400e' }}>Demo mod — mushroom.id API ključ nije postavljen</p>
            <p className="text-xs mb-2" style={{ color: '#78350f' }}>
              Dodaj ključ u <code className="font-mono bg-amber-100 px-1 rounded">.env</code> fajl:
            </p>
            <code className="block text-xs font-mono p-2 rounded" style={{ background: '#fef3c7', color: '#78350f' }}>
              VITE_MUSHROOMID_API_KEY=tvoj_kljuc
            </code>
            <p className="text-xs mt-2" style={{ color: '#92400e' }}>
              Besplatan ključ (100/dan): <strong>mushroom.id</strong>
            </p>
          </div>
        )}

        {/* Savjeti */}
        {!image && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-3">
            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>Savjeti za bolju identifikaciju</p>
            {[
              'Fotografišite klobuk odozgo i ispod',
              'Uključite dršku u kadar',
              'Koristite prirodno osvjetljenje',
              'Izbjegajte zamućene fotografije',
              'Fotografišite na neutralnoj podlozi',
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ background: '#f0fdf4', color: '#166534' }}>
                  {i + 1}
                </div>
                <p className="text-sm" style={{ color: '#57534e' }}>{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-xl p-4 text-center" style={{ background: '#fafaf9' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
            Rezultati identifikacije nisu 100% tačni. Uvijek konsultujte stručnjaka
            za mikologiju prije konzumiranja bilo koje divlje gljive.
          </p>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
