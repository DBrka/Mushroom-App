import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Utensils, Ban, Skull, Search, X } from 'lucide-react';
import { mushrooms, Mushroom, MushroomCategory, SECTIONS } from '../../data/mushrooms';

interface LibraryProps {
  onBack: () => void;
  onSelectMushroom: (mushroom: Mushroom) => void;
  isVisible?: boolean;
}

type Tab = MushroomCategory;

const tabs: { id: Tab; label: string; Icon: any; color: string; bg: string; activeBg: string }[] = [
  { id: 'jestiva',    label: 'Jestive',    Icon: Utensils, color: '#166534', bg: '#f0fdf4', activeBg: '#166534' },
  { id: 'nejestiva',  label: 'Nejestive',  Icon: Ban,      color: '#92400e', bg: '#fffbeb', activeBg: '#b45309' },
  { id: 'smrtonosna', label: 'Smrtonosne', Icon: Skull,    color: '#991b1b', bg: '#fff1f2', activeBg: '#dc2626' },
];

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ background: '#fef08a', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

export function Library({ onBack, onSelectMushroom, isVisible }: LibraryProps) {
  const [activeTab, setActiveTab] = useState<Tab>('jestiva');
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const savedScrollPos = useRef<number>(0);

  // Save scroll position before navigating away
  const handleSelectMushroom = (mushroom: Mushroom) => {
    if (scrollRef.current) {
      savedScrollPos.current = scrollRef.current.scrollTop;
    }
    onSelectMushroom(mushroom);
  };

  // Restore scroll position when Library becomes visible again
  useEffect(() => {
    if (!isVisible) return;
    const el = scrollRef.current;
    if (!el) return;
    const id = requestAnimationFrame(() => {
      el.scrollTop = savedScrollPos.current;
    });
    return () => cancelAnimationFrame(id);
  }, [isVisible]);

  const isSearching = search.trim().length > 0;
  const tab = tabs.find(t => t.id === activeTab)!;

  // Search mode: search across ALL categories
  const searchResults = isSearching
    ? mushrooms.filter(m => {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.latinName.toLowerCase().includes(q) ||
          m.habitat?.toLowerCase().includes(q) ||
          m.notes?.toLowerCase().includes(q)
        );
      })
    : [];

  // Browse mode: filter by active tab only
  const filtered = mushrooms.filter(m => m.category === activeTab);
  const grouped = SECTIONS
    .map(section => ({
      section,
      items: filtered.filter(m => m.section === section.id),
    }))
    .filter(g => g.items.length > 0);

  return (
    <div className="size-full flex flex-col" style={{ background: '#f8f7f4' }}>
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-stone-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <button onClick={onBack}
            className="size-9 flex items-center justify-center rounded-xl"
            style={{ background: '#f1f5f9' }}>
            <ArrowLeft className="size-5" style={{ color: '#475569' }} />
          </button>
          <div>
            <h2 className="text-xl font-bold leading-tight" style={{ color: '#1c1917' }}>Biblioteka gljiva</h2>
            <p className="text-xs" style={{ color: '#a8a29e' }}>{mushrooms.length} vrsta</p>
          </div>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 pointer-events-none" style={{ color: '#94a3b8' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Pretraži po imenu, latinskom nazivu, staništu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: '#f1f5f9', color: '#1c1917' }}
            />
            {isSearching && (
              <button
                className="absolute right-3 size-5 flex items-center justify-center rounded-full"
                style={{ background: '#cbd5e1' }}
                onClick={() => { setSearch(''); inputRef.current?.focus(); }}>
                <X className="size-3" style={{ color: '#475569' }} />
              </button>
            )}
          </div>
        </div>

        {/* Category tabs — only visible in browse mode */}
        {!isSearching && (
          <div className="flex px-4 pb-4 gap-2">
            {tabs.map(t => {
              const active = activeTab === t.id;
              const count = mushrooms.filter(m => m.category === t.id).length;
              return (
                <button key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={active
                    ? { background: t.activeBg, color: 'white' }
                    : { background: t.bg, color: t.color }}>
                  <t.Icon className="size-3.5" />
                  <span className="text-xs">{t.label}</span>
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search result count */}
        {isSearching && (
          <div className="px-4 pb-3">
            <p className="text-xs" style={{ color: '#78716c' }}>
              {searchResults.length === 0
                ? `Nema rezultata za "${search}"`
                : `${searchResults.length} ${searchResults.length === 1 ? 'rezultat' : searchResults.length < 5 ? 'rezultata' : 'rezultata'} za "${search}"`}
            </p>
          </div>
        )}
      </div>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4">

        {/* ── SEARCH MODE ── */}
        {isSearching && (
          <>
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <div className="size-14 rounded-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
                  <Search className="size-6" style={{ color: '#94a3b8' }} />
                </div>
                <p className="text-stone-400 text-sm text-center">
                  Nije pronađena nijedna gljiva.<br />
                  <span className="text-xs">Pokušaj s latinskim nazivom ili staništem.</span>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map(mushroom => {
                  const t = tabs.find(t => t.id === mushroom.category)!;
                  return (
                    <SearchCard
                      key={mushroom.id}
                      mushroom={mushroom}
                      tab={t}
                      query={search}
                      onSelect={() => handleSelectMushroom(mushroom)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── BROWSE MODE ── */}
        {!isSearching && (
          <>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48">
                <p className="text-stone-400 text-sm">Nema gljiva u ovoj kategoriji.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(({ section, items }) => (
                  <div key={section.id}>
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-0.5 w-3 rounded-full" style={{ background: tab.activeBg }} />
                        <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: tab.color }}>
                          {section.name}
                        </h3>
                        <span className="text-xs ml-auto" style={{ color: '#a8a29e' }}>{items.length}</span>
                      </div>
                      <p className="text-xs leading-relaxed pl-5" style={{ color: '#a8a29e' }}>
                        {section.latinFamily}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {items.map(mushroom => (
                        <MushroomCard
                          key={mushroom.id}
                          mushroom={mushroom}
                          tab={tab}
                          onSelect={() => handleSelectMushroom(mushroom)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}

// Card used in browse mode
function MushroomCard({ mushroom, tab, onSelect }: { mushroom: Mushroom; tab: typeof tabs[0]; onSelect: () => void }) {
  return (
    <button onClick={onSelect}
      className="text-left rounded-2xl overflow-hidden shadow-sm transition-all active:scale-95"
      style={{ background: 'white', border: '1px solid #e7e5e4' }}>
      <div className="relative h-28">
        <img src={mushroom.image} alt={mushroom.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />
        <div className="absolute top-2 right-2 size-6 rounded-full flex items-center justify-center"
          style={{ background: tab.activeBg }}>
          <tab.Icon className="size-3.5 text-white" />
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight" style={{ color: '#1c1917' }}>{mushroom.name}</p>
        <p className="text-xs italic mt-0.5 leading-tight" style={{ color: '#78716c' }}>{mushroom.latinName}</p>
        <div className="flex gap-0.5 mt-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full"
              style={{ background: mushroom.activeMonths.includes(i + 1) ? tab.activeBg : '#e7e5e4' }} />
          ))}
        </div>
      </div>
    </button>
  );
}

// Card used in search mode — shows category badge + highlights match
function SearchCard({ mushroom, tab, query, onSelect }: {
  mushroom: Mushroom; tab: typeof tabs[0]; query: string; onSelect: () => void;
}) {
  return (
    <button onClick={onSelect}
      className="text-left rounded-2xl overflow-hidden shadow-sm transition-all active:scale-95"
      style={{ background: 'white', border: '1px solid #e7e5e4' }}>
      <div className="relative h-28">
        <img src={mushroom.image} alt={mushroom.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
        {/* Category badge top-right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: tab.activeBg }}>
          <tab.Icon className="size-3 text-white" />
          <span className="text-white text-xs font-medium">{tab.label.slice(0, -1)}</span>
        </div>
      </div>
      <div className="p-3">
        <p className="font-semibold text-sm leading-tight" style={{ color: '#1c1917' }}>
          {highlight(mushroom.name, query)}
        </p>
        <p className="text-xs italic mt-0.5 leading-tight" style={{ color: '#78716c' }}>
          {highlight(mushroom.latinName, query)}
        </p>
        <div className="flex gap-0.5 mt-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full"
              style={{ background: mushroom.activeMonths.includes(i + 1) ? tab.activeBg : '#e7e5e4' }} />
          ))}
        </div>
      </div>
    </button>
  );
}
