import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Utensils, Ban, Skull, MapPin, Leaf, X, ChevronLeft, ChevronRight, Pencil, Plus, Check, Loader2 } from 'lucide-react';
import { Mushroom, MONTHS_SR } from '../../data/mushrooms';

// ── GitHub config ──────────────────────────────────────────────────────────
const GH_OWNER  = 'DBrka';
const GH_REPO   = 'Mushroom-App';
const GH_BRANCH = 'main';
const GH_PAT    = import.meta.env.VITE_GITHUB_PAT ?? '';
const RAW_BASE  = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/images/mushrooms`;

// Session cache — avoid re-fetching extra images for the same mushroom
const extraCache = new Map<number, string[]>();

function ghHeaders() {
  return { Authorization: `Bearer ${GH_PAT}`, 'Content-Type': 'application/json' };
}

function ghContentsUrl(filename: string) {
  return `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/images/mushrooms/${filename}`;
}

// Check GitHub indices 09–20 in parallel; return URLs for those that exist
async function fetchExtraImages(mushroomId: number): Promise<string[]> {
  if (extraCache.has(mushroomId)) return extraCache.get(mushroomId)!;
  const checks = Array.from({ length: 12 }, (_, i) => {
    const filename = `m${mushroomId}_${String(9 + i).padStart(2, '0')}.jpg`;
    return fetch(ghContentsUrl(filename), { headers: ghHeaders() })
      .then(r => r.ok ? `${RAW_BASE}/${filename}` : null)
      .catch(() => null);
  });
  const results = (await Promise.all(checks)).filter((u): u is string => u !== null);
  extraCache.set(mushroomId, results);
  return results;
}

// Get SHA then PUT — handles both create and update
async function uploadToGitHub(filename: string, base64: string): Promise<string> {
  const url = ghContentsUrl(filename);
  const hdrs = ghHeaders();
  let sha: string | undefined;
  const check = await fetch(url, { headers: hdrs });
  if (check.ok) sha = (await check.json()).sha;

  const body: Record<string, string> = { message: `Add ${filename}`, content: base64, branch: GH_BRANCH };
  if (sha) body.sha = sha;

  const res = await fetch(url, { method: 'PUT', headers: hdrs, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}) as any);
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  // Purge CDN cache; use raw URL immediately (CDN can take minutes)
  fetch(`https://purge.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/images/mushrooms/${filename}`).catch(() => {});
  return `${RAW_BASE}/${filename}`;
}

// Get SHA then DELETE
async function deleteFromGitHub(filename: string): Promise<void> {
  const url  = ghContentsUrl(filename);
  const hdrs = ghHeaders();
  const check = await fetch(url, { headers: hdrs });
  if (!check.ok) return; // Already gone
  const { sha } = await check.json();
  const res = await fetch(url, {
    method: 'DELETE', headers: hdrs,
    body: JSON.stringify({ message: `Delete ${filename}`, sha, branch: GH_BRANCH }),
  });
  if (!res.ok && res.status !== 404) {
    const err = await res.json().catch(() => ({}) as any);
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }
  fetch(`https://purge.jsdelivr.net/gh/${GH_OWNER}/${GH_REPO}@${GH_BRANCH}/images/mushrooms/${filename}`).catch(() => {});
}

function storageGet(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = ev => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 1200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// ── Component ──────────────────────────────────────────────────────────────

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
  const cfg  = categoryConfig[mushroom.category];
  const Icon = cfg.icon;

  // Standard images hidden locally (deleted from GitHub — URL still in mushrooms.ts)
  const [localHidden, setLocalHidden] = useState<string[]>(() => storageGet(`mush_del_${mushroom.id}`));
  // Extra images fetched dynamically from GitHub (index 09+)
  const [extraImages, setExtraImages]   = useState<string[]>([]);
  const [loadingExtra, setLoadingExtra] = useState(true);
  const [editMode, setEditMode]         = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const baseImages: string[] = mushroom.images?.length ? mushroom.images : [mushroom.image];
  const allImages: string[]  = [...baseImages.filter(u => !localHidden.includes(u)), ...extraImages];

  const [activeIdx, setActiveIdx] = useState(0);
  const safeIdx = Math.min(activeIdx, Math.max(0, allImages.length - 1));

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx,  setLightboxIdx]  = useState(0);

  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const touchRef = useRef<{
    type: 'pinch' | 'swipe' | 'pan';
    d0?: number; z0?: number;
    x0?: number; y0?: number;
    px0?: number; py0?: number;
  } | null>(null);

  useEffect(() => { setZoom(1); setPanX(0); setPanY(0); }, [lightboxIdx]);

  // Fetch extra images from GitHub on mount
  useEffect(() => {
    setLoadingExtra(true);
    fetchExtraImages(mushroom.id)
      .then(imgs => setExtraImages(imgs))
      .catch(() => {})
      .finally(() => setLoadingExtra(false));
  }, [mushroom.id]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDeleteImage = async (url: string) => {
    setDeleting(true);
    setActionError(null);
    try {
      const filename = url.split('/').pop()!;
      await deleteFromGitHub(filename);

      if (extraImages.includes(url)) {
        // Extra image — remove from state and cache
        const next = extraImages.filter(u => u !== url);
        setExtraImages(next);
        extraCache.set(mushroom.id, next);
      } else {
        // Standard image — hide locally so the hardcoded URL doesn't show
        const next = [...localHidden, url];
        setLocalHidden(next);
        localStorage.setItem(`mush_del_${mushroom.id}`, JSON.stringify(next));
      }
      // Clamp active index
      setActiveIdx(i => Math.max(0, Math.min(i, allImages.length - 2)));
    } catch (err: any) {
      setActionError(err.message ?? 'Brisanje nije uspjelo');
    } finally {
      setDeleting(false);
    }
  };

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setActionError(null);
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const base64  = dataUrl.split(',')[1];
      // Next index after all known images (base + extra)
      const nextIdx  = baseImages.length + extraImages.length + 1;
      const filename = `m${mushroom.id}_${String(nextIdx).padStart(2, '0')}.jpg`;
      const remoteUrl = await uploadToGitHub(filename, base64);
      const next = [...extraImages, remoteUrl];
      setExtraImages(next);
      extraCache.set(mushroom.id, next);
      setActiveIdx(allImages.length); // go to newly added image
    } catch (err: any) {
      setActionError(err.message ?? 'Upload nije uspio');
    } finally {
      setUploading(false);
    }
  };

  // ── Lightbox touch ────────────────────────────────────────────────────────

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current = { type: 'pinch', d0: Math.hypot(dx, dy), z0: zoom };
    } else if (zoom > 1) {
      touchRef.current = { type: 'pan', x0: e.touches[0].clientX, y0: e.touches[0].clientY, px0: panX, py0: panY };
    } else {
      touchRef.current = { type: 'swipe', x0: e.touches[0].clientX, y0: e.touches[0].clientY };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const t = touchRef.current;
    if (!t) return;
    if (t.type === 'pinch' && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setZoom(Math.max(1, Math.min(5, t.z0! * (Math.hypot(dx, dy) / t.d0!))));
    } else if (t.type === 'pan') {
      setPanX(t.px0! + (e.touches[0].clientX - t.x0!));
      setPanY(t.py0! + (e.touches[0].clientY - t.y0!));
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touchRef.current;
    if (!t) return;
    if (t.type === 'pinch') {
      if (zoom < 1.1) { setZoom(1); setPanX(0); setPanY(0); }
    } else if (t.type === 'swipe' && e.changedTouches.length > 0 && allImages.length > 1) {
      const dx = e.changedTouches[0].clientX - t.x0!;
      const dy = e.changedTouches[0].clientY - t.y0!;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        setLightboxIdx(i => dx < 0
          ? (i + 1) % allImages.length
          : (i - 1 + allImages.length) % allImages.length);
      }
    }
    touchRef.current = null;
  };

  const heroImage = allImages.length > 0 ? allImages[safeIdx] : null;
  const busy = uploading || deleting;

  return (
    <div className="size-full flex flex-col bg-stone-50">

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAddImage} />

      {/* ── Hero ── */}
      <div className="relative h-60 flex-shrink-0">
        {heroImage ? (
          <img
            src={heroImage}
            alt={mushroom.name}
            className="w-full h-full object-cover"
            style={{ cursor: editMode ? 'default' : 'pointer' }}
            onClick={() => { if (!editMode) { setLightboxIdx(safeIdx); setLightboxOpen(true); } }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#1c1917' }}>
            <span className="text-6xl opacity-20">🍄</span>
          </div>
        )}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.65) 100%)' }} />

        <button onClick={onBack}
          className="absolute top-4 left-4 size-10 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="size-5 text-white" />
        </button>

        <button
          onClick={() => !busy && setEditMode(m => !m)}
          className="absolute top-4 right-4 size-10 flex items-center justify-center rounded-full transition-all active:scale-95"
          style={{ background: editMode ? 'rgba(74,222,128,0.85)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
          {editMode ? <Check className="size-5 text-white" /> : <Pencil className="size-4 text-white" />}
        </button>

        {!editMode && allImages.length > 1 && (
          <div className="absolute top-4 right-16 px-2.5 py-1 rounded-full text-xs text-white font-medium"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}>
            {safeIdx + 1} / {allImages.length}
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <h1 className="text-white text-xl font-semibold leading-tight">{mushroom.name}</h1>
          <p className="text-white/70 italic text-sm mt-0.5">{mushroom.latinName}</p>
        </div>
      </div>

      {/* ── Thumbnail strip ── */}
      {(allImages.length > 1 || editMode || loadingExtra) && (
        <div className="flex-shrink-0 bg-black">
          <div className="flex gap-1 p-1 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
            {allImages.map((src, i) => (
              <div key={src} className="relative flex-shrink-0">
                <button
                  onClick={() => setActiveIdx(i)}
                  className="rounded overflow-hidden block transition-all active:scale-95"
                  style={{
                    width: 56, height: 44,
                    outline: i === safeIdx ? '2px solid #4ade80' : '2px solid transparent',
                    opacity: i === safeIdx ? 1 : 0.55,
                  }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
                {editMode && (
                  <button
                    onClick={() => !busy && handleDeleteImage(src)}
                    className="absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center z-10"
                    style={{ background: deleting ? '#6b7280' : '#dc2626' }}
                    disabled={busy}>
                    {deleting ? <Loader2 className="size-3 text-white animate-spin" /> : <X className="size-3 text-white" />}
                  </button>
                )}
              </div>
            ))}

            {/* Loading extra images indicator */}
            {loadingExtra && (
              <div className="flex-shrink-0 rounded flex items-center justify-center" style={{ width: 44, height: 44 }}>
                <Loader2 className="size-4 text-white/30 animate-spin" />
              </div>
            )}

            {/* Add image button */}
            {editMode && (
              <button
                onClick={() => !busy && fileInputRef.current?.click()}
                className="flex-shrink-0 rounded flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95"
                style={{
                  width: 64, height: 44,
                  background: 'rgba(74,222,128,0.12)',
                  border: '1.5px dashed rgba(74,222,128,0.5)',
                }}
                disabled={busy}>
                {uploading
                  ? <Loader2 className="size-4 text-green-400 animate-spin" />
                  : <Plus className="size-4 text-green-400" />}
                <span className="text-green-400 leading-none" style={{ fontSize: 8 }}>
                  {uploading ? 'Upload...' : 'Dodaj'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <div className="flex-shrink-0 px-4 py-2 flex items-center gap-2" style={{ background: '#fef2f2' }}>
          <span className="text-red-600 text-xs flex-1">Greška: {actionError}</span>
          <button onClick={() => setActionError(null)}><X className="size-4 text-red-400" /></button>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto p-4 space-y-4">

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
            style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}>
            <Icon className="size-4" />
            {cfg.label}
          </div>

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
                    <div className="rounded h-7 w-full flex items-center justify-center text-xs font-bold"
                      style={active ? { background: cfg.activeBg, color: 'white' } : { background: '#f1f5f9', color: '#94a3b8' }}>
                      {active ? '●' : ''}
                    </div>
                    <span className="text-xs text-stone-400 leading-none" style={{ fontSize: 9 }}>{month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="size-3 rounded" style={{ background: cfg.activeBg }} />
              <span className="text-xs text-stone-500">Aktivna sezona</span>
            </div>
          </div>

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

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 flex gap-3 items-start">
            <MapPin className="size-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 mb-1">Stanište</p>
              <p className="text-stone-700 text-sm leading-relaxed">{mushroom.habitat}</p>
            </div>
          </div>

          {mushroom.category === 'smrtonosna' && (
            <div className="rounded-2xl p-4 border-2" style={{ background: '#fff1f2', borderColor: '#fca5a5' }}>
              <div className="flex gap-3 items-start">
                <Skull className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#991b1b' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#7f1d1d' }}>
                  <strong>OPASNOST:</strong> Ova gljiva je smrtonosno otrovana. Nikada je ne konzumirajte.
                  Čak i mali dijelovi mogu uzrokovati zatajenje organa.
                </p>
              </div>
            </div>
          )}

          {mushroom.category === 'nejestiva' && (
            <div className="rounded-2xl p-4 border-2" style={{ background: '#fffbeb', borderColor: '#fcd34d' }}>
              <div className="flex gap-3 items-start">
                <Ban className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#92400e' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>
                  <strong>UPOZORENJE:</strong> Ova gljiva nije jestiva i može izazvati trovanje ili ozbiljne zdravstvene probleme.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-xl p-4 text-center" style={{ background: '#f8fafc' }}>
            <p className="text-xs text-stone-500 leading-relaxed">
              Ova aplikacija služi isključivo u obrazovne svrhe. Nikada ne konzumirajte
              gljive bez provjere stručnjaka za mikologiju.
            </p>
          </div>

          <div className="h-4" />
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.97)', touchAction: 'none' }}
          onClick={() => { if (zoom <= 1) setLightboxOpen(false); }}
        >
          <button
            className="absolute top-4 right-4 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
            style={{ background: 'rgba(255,255,255,0.12)' }}
            onClick={e => { e.stopPropagation(); setLightboxOpen(false); }}>
            <X className="size-6 text-white" />
          </button>

          <div className="absolute top-4 left-0 right-0 text-center pointer-events-none px-16">
            <p className="text-white font-semibold text-sm">{mushroom.name}</p>
            <p className="text-white/50 italic text-xs mt-0.5">{mushroom.latinName}</p>
          </div>

          <div className="absolute top-14 left-0 right-0 text-center pointer-events-none">
            <p className="text-white/50 text-xs">{lightboxIdx + 1} / {allImages.length}</p>
            {zoom > 1.05 && <p className="text-white/30 text-xs mt-0.5">{Math.round(zoom * 100)}%</p>}
          </div>

          {zoom <= 1 && allImages.length > 1 && (
            <>
              <button
                className="absolute left-3 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i - 1 + allImages.length) % allImages.length); }}>
                <ChevronLeft className="size-6 text-white" />
              </button>
              <button
                className="absolute right-3 size-11 rounded-full flex items-center justify-center z-10 transition-all active:scale-90"
                style={{ background: 'rgba(255,255,255,0.12)' }}
                onClick={e => { e.stopPropagation(); setLightboxIdx(i => (i + 1) % allImages.length); }}>
                <ChevronRight className="size-6 text-white" />
              </button>
            </>
          )}

          <div
            style={{ position: 'absolute', inset: 0, padding: '72px 60px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={allImages[lightboxIdx]}
              alt={mushroom.name}
              style={{
                maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: 'center center',
                userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none',
              }}
              draggable={false}
            />
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 flex-wrap px-8 pointer-events-none">
              {allImages.map((_, i) => (
                <div key={i} className="rounded-full transition-all"
                  style={{ width: i === lightboxIdx ? 20 : 6, height: 6, background: i === lightboxIdx ? '#4ade80' : 'rgba(255,255,255,0.35)' }} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
