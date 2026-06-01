import { useState, useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { IntroScreen } from './components/IntroScreen';
import { Home } from './components/Home';
import { Identify } from './components/Identify';
import { Library } from './components/Library';
import { MushroomDetail } from './components/MushroomDetail';
import { IdentificationResult } from './components/IdentificationResult';
import { SveOGljivama } from './components/SveOGljivama';
import { Mushroom } from '../data/mushrooms';
import { IdentificationSuggestion } from './components/Identify';

type View = 'intro' | 'home' | 'identify' | 'library' | 'detail' | 'result' | 'literatura';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('intro');
  const [selectedMushroom, setSelectedMushroom] = useState<Mushroom | null>(null);
  const [identifiedResults, setIdentifiedResults] = useState<IdentificationSuggestion[]>([]);
  const [previousView, setPreviousView] = useState<View>('library');

  const navigate = (view: View) => setCurrentView(view);

  const openDetail = (mushroom: Mushroom, from: View = 'library') => {
    setSelectedMushroom(mushroom);
    setPreviousView(from);
    setCurrentView('detail');
  };

  const handleIdentify = (results: IdentificationSuggestion[]) => {
    setIdentifiedResults(results);
    setCurrentView('result');
  };

  // Android hardware back button
  useEffect(() => {
    const handler = CapApp.addListener('backButton', () => {
      switch (currentView) {
        case 'intro':
          CapApp.exitApp();
          break;
        case 'home':
          CapApp.exitApp();
          break;
        case 'identify':
          navigate('home');
          break;
        case 'library':
          navigate('home');
          break;
        case 'literatura':
          navigate('home');
          break;
        case 'detail':
          navigate(previousView);
          break;
        case 'result':
          navigate('identify');
          break;
        default:
          navigate('home');
      }
    });
    return () => { handler.then(h => h.remove()); };
  }, [currentView, previousView]);

  return (
    <div className="size-full" style={{ background: '#f8f7f4' }}>
      {currentView === 'intro' && (
        <IntroScreen onFinish={() => navigate('home')} />
      )}
      {currentView === 'home' && (
        <Home onNavigate={navigate} />
      )}
      {currentView === 'identify' && (
        <Identify
          onIdentify={handleIdentify}
          onBack={() => navigate('home')}
        />
      )}
      {/* Library stays mounted to preserve scroll position and search state */}
      <div className="size-full" style={{ display: currentView === 'library' ? 'flex' : 'none', flexDirection: 'column' }}>
        <Library
          onBack={() => navigate('home')}
          onSelectMushroom={(m) => openDetail(m, 'library')}
          isVisible={currentView === 'library'}
        />
      </div>
      {currentView === 'literatura' && (
        <SveOGljivama onBack={() => navigate('home')} />
      )}
      {currentView === 'detail' && selectedMushroom && (
        <MushroomDetail
          mushroom={selectedMushroom}
          onBack={() => navigate(previousView)}
        />
      )}
      {currentView === 'result' && identifiedResults.length > 0 && (
        <IdentificationResult
          results={identifiedResults}
          onBack={() => navigate('identify')}
          onHome={() => navigate('home')}
          onDetail={(mushroom) => openDetail(mushroom, 'result')}
        />
      )}
    </div>
  );
}
