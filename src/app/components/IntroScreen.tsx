import { useEffect, useState } from 'react';

interface IntroScreenProps {
  onFinish: () => void;
}

export function IntroScreen({ onFinish }: IntroScreenProps) {
  const [seconds, setSeconds] = useState(10);

  useEffect(() => {
    if (seconds <= 0) {
      onFinish();
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, onFinish]);

  return (
    <div className="size-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0d2b1a 0%, #1a3d22 40%, #0f2318 100%)' }}>

      {/* Background stars/particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 1 + 'px',
              height: Math.random() * 3 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.4 + 0.1,
            }} />
        ))}
      </div>

      {/* Animated forest floor silhouette */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <svg viewBox="0 0 400 120" className="w-full" preserveAspectRatio="none">
          <path d="M0,80 Q30,50 60,70 Q90,90 120,60 Q150,30 180,55 Q210,80 240,50 Q270,20 300,45 Q330,70 360,40 Q390,10 400,30 L400,120 L0,120 Z"
            fill="#0a1f12" opacity="0.8" />
          <path d="M0,100 Q40,80 80,90 Q120,100 160,85 Q200,70 240,88 Q280,106 320,90 Q360,74 400,85 L400,120 L0,120 Z"
            fill="#071510" />
        </svg>
      </div>

      {/* Main content */}
      <div className="flex flex-col items-center z-10 px-8 max-w-sm w-full">
        {/* Animated mushroom SVG */}
        <div style={{ animation: 'mushroomGrow 1.2s ease-out forwards, mushroomFloat 3s ease-in-out 1.2s infinite' }}>
          <svg viewBox="0 0 120 140" className="w-48 h-48 drop-shadow-2xl" fill="none">
            {/* Stem */}
            <ellipse cx="60" cy="118" rx="14" ry="6" fill="#c8a96e" opacity="0.4" />
            <rect x="48" y="80" width="24" height="44" rx="12" fill="#e8c98a" />
            <rect x="52" y="80" width="8" height="44" rx="4" fill="#f0d9a0" opacity="0.5" />
            {/* Gills */}
            <path d="M34,85 Q60,95 86,85" stroke="#c8a96e" strokeWidth="1.5" fill="none" opacity="0.6" />
            <path d="M38,90 Q60,98 82,90" stroke="#c8a96e" strokeWidth="1" fill="none" opacity="0.4" />
            {/* Cap */}
            <path d="M14,82 Q14,40 60,30 Q106,40 106,82 Q90,78 60,80 Q30,78 14,82 Z"
              fill="#8b2e10" />
            <path d="M18,82 Q18,44 60,35 Q102,44 102,82 Q85,79 60,80 Q35,79 18,82 Z"
              fill="#a33a14" />
            {/* Cap highlight */}
            <path d="M35,50 Q60,35 80,50" stroke="#c85522" strokeWidth="3" fill="none" opacity="0.4" strokeLinecap="round" />
            {/* White spots */}
            <circle cx="45" cy="58" r="7" fill="white" opacity="0.85" />
            <circle cx="68" cy="48" r="5" fill="white" opacity="0.85" />
            <circle cx="82" cy="63" r="6" fill="white" opacity="0.85" />
            <circle cx="34" cy="70" r="4" fill="white" opacity="0.7" />
            <circle cx="60" cy="72" r="3.5" fill="white" opacity="0.7" />
            {/* Shimmer */}
            <ellipse cx="52" cy="46" rx="10" ry="5" fill="white" opacity="0.12" transform="rotate(-20 52 46)" />
            {/* Stem ring */}
            <ellipse cx="60" cy="88" rx="13" ry="4" fill="#d4b07a" opacity="0.6" />
            <ellipse cx="60" cy="88" rx="13" ry="4" stroke="#c8a96e" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Quote */}
        <div className="mt-8 text-center space-y-2"
          style={{ animation: 'fadeInUp 1.5s ease-out 0.5s both' }}>
          <p className="text-white text-lg leading-relaxed font-light italic"
            style={{ textShadow: '0 2px 12px rgba(0,0,0,0.8)', fontFamily: 'Georgia, serif' }}>
            "Gljivarenje je ljubav koja budi emocije i sjećanje na naše bližnje"
          </p>
        </div>

        {/* Countdown ring + skip */}
        <div className="mt-10 flex flex-col items-center gap-4"
          style={{ animation: 'fadeInUp 1.5s ease-out 1s both' }}>
          <div className="relative size-14 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="3"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - seconds / 10)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <span className="text-white text-xl font-semibold" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              {seconds}
            </span>
          </div>

          <button onClick={onFinish}
            className="px-6 py-2 rounded-full text-white text-sm font-medium transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(8px)' }}>
            Preskoči →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes mushroomGrow {
          from { opacity: 0; transform: scale(0.3) translateY(40px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes mushroomFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
