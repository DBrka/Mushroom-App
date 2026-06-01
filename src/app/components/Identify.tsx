import { useState, useRef, useEffect } from 'react';
import { Camera, Image as ImageIcon, ArrowLeft, Loader2, AlertCircle, X, Sparkles } from 'lucide-react';
import { mushrooms, Mushroom } from '../../data/mushrooms';

interface IdentifyProps {
  onIdentify: (results: IdentificationSuggestion[]) => void;
  onBack: () => void;
}

// Tip koji predstavlja jedan rezultat identifikacije
export interface IdentificationSuggestion {
  latinName: string;         // iz mushroom.id API-a
  commonName: string;        // zajednički naziv (iz API-a ili naše baze)
  confidence: number;        // 0.0 – 1.0
  localMushroom?: Mushroom;  // podudaranje iz naše baze (opciono)
}

// ── mushroom.id API ───────────────────────────────────────────────────────────
const MUSHROOMID_API_KEY  = import.meta.env.VITE_MUSHROOMID_API_KEY ?? '';
const MUSHROOMID_URL      = 'https://mushroom.kindwise.com/api/v1/identification';
const MUSHROOMID_USAGE    = 'https://mushroom.kindwise.com/api/v1/usage_info';

interface UsageInfo {
  remaining: number;
  limit: number;
  used: number;
}

async function fetchUsage(): Promise<UsageInfo | null> {
  try {
    const res = await fetch(MUSHROOMID_USAGE, {
      headers: { 'Api-Key': MUSHROOMID_API_KEY },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      remaining: data?.remaining?.day ?? 0,
      limit:     data?.credit_limits?.day ?? 100,
      used:      data?.used?.day ?? 0,
    };
  } catch {
    return null;
  }
}

// Pokušaj da nađe gljivu u našoj bazi po latinskom nazivu
function matchLocal(latinName: string): Mushroom | undefined {
  const needle = latinName.toLowerCase().trim();
  // Egzaktan match
  const exact = mushrooms.find(m => m.latinName.toLowerCase() === needle);
  if (exact) return exact;
  // Genus + species
  const parts = needle.split(' ');
  if (parts.length >= 2) {
    const found = mushrooms.find(m => {
      const mp = m.latinName.toLowerCase().split(' ');
      return mp[0] === parts[0] && mp[1] === parts[1];
    });
    if (found) return found;
  }
  return undefined;
}

async function identifyWithMushroomId(imageDataUrl: string): Promise<IdentificationSuggestion[]> {
  const response = await fetch(MUSHROOMID_URL, {
    method: 'POST',
    headers: {
      'Api-Key': MUSHROOMID_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ images: [imageDataUrl] }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err?.message ?? err?.error ?? response.statusText;
    if (response.status === 401 || response.status === 403) throw new Error('INVALID_KEY');
    if (response.status === 429) throw new Error('RATE_LIMIT');
    throw new Error(`mushroom.id greška ${response.status}: ${msg}`);
  }

  const data = await response.json();

  // Provjeri da li je gljiva uopće na slici
  if (data?.result?.is_mushroom?.binary === false) {
    throw new Error('Na slici nije pronađena gljiva. Pokušaj ponovo sa boljom fotografijom.');
  }

  const suggestions = data?.result?.classification?.suggestions ?? [];
  if (suggestions.length === 0) throw new Error('Nije pronađena nijedna gljiva.');

  // Mapiraj sve rezultate, pokušaj match na lokalnu bazu
  const results: IdentificationSuggestion[] = suggestions.slice(0, 5).map((s: any) => {
    const local = matchLocal(s.name);
    return {
      latinName: s.name,
      commonName: local?.name ?? s.name, // naš naziv ako postoji, inače latinski
      confidence: Math.min(0.99, Math.max(0.01, s.probability ?? 0.5)),
      localMushroom: local,
    };
  });

  return results;
}

// ── Demo mode ─────────────────────────────────────────────────────────────────
function identifyDemo(): IdentificationSuggestion[] {
  return [...mushrooms]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .map((m, i) => ({
      latinName: m.latinName,
      commonName: m.name,
      confidence: Math.max(0.1, 0.85 - i * 0.15),
      localMushroom: m,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────

export function Identify({ onIdentify, onBack }: IdentifyProps) {
  const [image, setImage]         = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [step, setStep]           = useState<string>('');
  const [usage, setUsage]         = useState<UsageInfo | null>(null);

  const cameraRef  = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const hasApiKey  = !!MUSHROOMID_API_KEY;

  // Dohvati usage info pri pokretanju
  useEffect(() => {
    if (hasApiKey) fetchUsage().then(setUsage);
  }, [hasApiKey]);

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
      let results: IdentificationSuggestion[];
      if (hasApiKey) {
        setStep('Šaljem sliku na mushroom.id...');
        results = await identifyWithMushroomId(image);
      } else {
        setStep('Demo mod...');
        await new Promise(r => setTimeout(r, 1500));
        results = identifyDemo();
      }
      setAnalyzing(false);
      setStep('');
      // Refresh usage nakon identifikacije
      if (hasApiKey) fetchUsage().then(setUsage);
      onIdentify(results);
    } catch (err: any) {
      setAnalyzing(false);
      setStep('');
      const msg: string = err?.message ?? 'Nepoznata greška';
      if (msg === 'INVALID_KEY') {
        setError('Nevažeći API ključ. Provjeri VITE_MUSHROOMID_API_KEY u .env fajlu.');
      } else if (msg === 'RATE_LIMIT') {
        setError('Dostignut dnevni limit od 100 identifikacija. Nastavak sutra.');
      } else if (msg.includes('fetch') || msg.includes('network') || msg.includes('Failed')) {
        setError('Nema internet veze. Potrebna je mreža za identifikaciju.');
      } else {
        setError(`Greška: ${msg}`);
      }
    }
  };

  return (
    <div className="size-full flex flex-col" style={{ background: '#f8f7f4' }}>
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 shadow-sm px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="size-9 flex items-center justify-center rounded-xl" style={{ background: '#f1f5f9' }}>
          <ArrowLeft className="size-5" style={{ color: '#475569' }} />
        </button>
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#1c1917' }}>Identifikacija gljive</h2>
          {hasApiKey ? (
            usage ? (
              <p className="text-xs font-medium" style={{ color: usage.remaining > 10 ? '#16a34a' : usage.remaining > 0 ? '#d97706' : '#dc2626' }}>
                ● mushroom.id — preostalo: <strong>{usage.remaining}/{usage.limit}</strong> danas
              </p>
            ) : (
              <p className="text-xs font-medium" style={{ color: '#16a34a' }}>● mushroom.id aktivan</p>
            )
          ) : (
            <p className="text-xs font-medium" style={{ color: '#f59e0b' }}>● Demo mod</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-5 space-y-4">

        {/* Upload zona */}
        {!image ? (
          <div className="rounded-3xl overflow-hidden" style={{ border: '2px dashed #bbf7d0', background: 'white' }}>
            <div className="flex flex-col items-center justify-center py-12 px-8 gap-5">
              <div className="size-20 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                <Sparkles className="size-9" style={{ color: '#166534' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg" style={{ color: '#1c1917' }}>Dodajte fotografiju gljive</p>
                <p className="text-sm mt-1" style={{ color: '#78716c' }}>
                  {hasApiKey ? 'mushroom.id će identificirati vrstu' : 'Demo mod — dodaj API ključ za identifikaciju'}
                </p>
                <p className="text-xs mt-1" style={{ color: '#a8a29e' }}>JPG, PNG, WEBP • maks. 10 MB</p>
              </div>
              <div className="flex gap-3 w-full max-w-xs">
                <button onClick={() => cameraRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#166534', color: 'white' }}>
                  <Camera className="size-4" /> Kamera
                </button>
                <button onClick={() => galleryRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: '#f0fdf4', color: '#166534', border: '1.5px solid #86efac' }}>
                  <ImageIcon className="size-4" /> Galerija
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden shadow-lg">
            <img src={image} alt="Fotografija" className="w-full max-h-80 object-cover" />
            <button onClick={() => { setImage(null); setError(null); }}
              className="absolute top-3 right-3 size-9 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.55)' }}>
              <X className="size-5 text-white" />
            </button>
            <div className="absolute bottom-3 right-3 flex gap-2">
              <button onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                <Camera className="size-3.5" /> Nova
              </button>
              <button onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                style={{ background: 'rgba(0,0,0,0.55)', color: 'white' }}>
                <ImageIcon className="size-3.5" /> Galerija
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl" style={{ background: '#fff1f2', border: '1px solid #fca5a5' }}>
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
            <p className="text-sm" style={{ color: '#7f1d1d' }}>{error}</p>
          </div>
        )}

        {image && !analyzing && (
          <button onClick={handleAnalyze}
            className="w-full py-4 rounded-2xl text-white font-semibold text-lg shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
            <Sparkles className="size-5" /> Identificiraj gljivu
          </button>
        )}

        {analyzing && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex flex-col items-center gap-4">
            <div className="size-16 rounded-2xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
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

        {/* Savjeti */}
        {!image && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100 space-y-3">
            <p className="font-semibold text-sm" style={{ color: '#1c1917' }}>Savjeti za bolju identifikaciju</p>
            {['Fotografišite klobuk odozgo i ispod', 'Uključite dršku u kadar', 'Koristite prirodno osvjetljenje', 'Izbjegajte zamućene fotografije', 'Fotografišite na neutralnoj podlozi'].map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="size-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold" style={{ background: '#f0fdf4', color: '#166534' }}>{i + 1}</div>
                <p className="text-sm" style={{ color: '#57534e' }}>{tip}</p>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl p-4 text-center" style={{ background: '#fafaf9' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#a8a29e' }}>
            Rezultati identifikacije nisu 100% tačni. Uvijek konsultujte stručnjaka za mikologiju prije konzumiranja bilo koje divlje gljive.
          </p>
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}
