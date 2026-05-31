import { Camera, BookOpen, AlertTriangle } from 'lucide-react';

type View = 'home' | 'identify' | 'library' | 'detail' | 'result' | 'intro' | 'literatura';

interface HomeProps {
  onNavigate: (view: View) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="size-full flex flex-col items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}>
      <div className="max-w-sm w-full space-y-8">

        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center size-24 rounded-3xl shadow-xl"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' }}>
            <svg viewBox="0 0 48 56" className="w-12 h-14" fill="none">
              {/* Stem */}
              <rect x="19" y="34" width="10" height="18" rx="5" fill="#e8c98a" />
              {/* Cap */}
              <path d="M4,34 Q4,12 24,8 Q44,12 44,34 Q34,31 24,32 Q14,31 4,34 Z" fill="#8b2e10" />
              <path d="M6,34 Q6,14 24,11 Q42,14 42,34 Q32,32 24,32 Q16,32 6,34 Z" fill="#a33a14" />
              {/* Spots */}
              <circle cx="18" cy="22" r="3.5" fill="white" opacity="0.9" />
              <circle cx="28" cy="17" r="2.5" fill="white" opacity="0.9" />
              <circle cx="34" cy="26" r="3" fill="white" opacity="0.9" />
              <circle cx="13" cy="29" r="2" fill="white" opacity="0.7" />
              {/* Ring */}
              <ellipse cx="24" cy="37" rx="6" ry="2" fill="#d4b07a" opacity="0.7" />
            </svg>
          </div>

          <div>
            <h1 className="text-4xl font-bold" style={{ color: '#14532d', letterSpacing: '-0.5px' }}>GljivaID</h1>
            <p className="text-base mt-1" style={{ color: '#166534' }}>Identificirajte gljive s pouzdanjem</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => onNavigate('identify')}
            className="w-full p-5 rounded-2xl shadow-lg text-white flex items-center gap-4 transition-all active:scale-98"
            style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)' }}>
            <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Camera className="size-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold">Identificiraj gljivu</p>
              <p className="text-sm text-white/70">Fotografišite i saznajte vrstu</p>
            </div>
          </button>

          <button
            onClick={() => onNavigate('library')}
            className="w-full p-5 rounded-2xl shadow-md flex items-center gap-4 transition-all active:scale-98"
            style={{ background: 'white', border: '1.5px solid #bbf7d0' }}>
            <div className="size-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#f0fdf4' }}>
              <BookOpen className="size-6" style={{ color: '#166534' }} />
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold" style={{ color: '#14532d' }}>Biblioteka gljiva</p>
              <p className="text-sm" style={{ color: '#16a34a' }}>Informacije o gljivama</p>
            </div>
          </button>

        </div>

        {/* Safety Warning */}
        <div className="rounded-2xl p-4 flex gap-3 items-start"
          style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
          <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" style={{ color: '#d97706' }} />
          <p className="text-sm leading-relaxed" style={{ color: '#78350f' }}>
            <strong>Sigurnosno upozorenje:</strong> Nikada ne konzumirajte divlje gljive bez
            provjere stručnjaka. Ova aplikacija je isključivo u obrazovne svrhe.
          </p>
        </div>
      </div>
    </div>
  );
}
