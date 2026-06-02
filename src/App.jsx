import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameLogic } from './hooks/useGameLogic.js';
import RedesignRoot from './themes/redesign/RedesignRoot.jsx';
import SettingsMenu from './shared/overlays/SettingsMenu.jsx';
import LoginMenu from './shared/overlays/LoginMenu.jsx';
import HowToPlayModal from './shared/overlays/HowToPlayModal.jsx';
import ReplayOverlay from './shared/overlays/ReplayOverlay.jsx';

function App() {
  const { dictionary } = useGameLogic();
  const [isMuted, setIsMuted] = useState(false);
  const [overlay, setOverlay] = useState(null); // 'howtoplay' | 'login' | 'settings' | null
  const [replaySession, setReplaySession] = useState(null);

  return (
    <>
      <RedesignRoot
        dictionary={dictionary}
        onHowToPlay={() => setOverlay('howtoplay')}
        onLogin={() => setOverlay('login')}
        onSettings={() => setOverlay('settings')}
      />

      {overlay === 'howtoplay' && (
        <HowToPlayModal onClose={() => setOverlay(null)} />
      )}
      {overlay === 'login' && (
        <LoginMenu onClose={() => setOverlay(null)} />
      )}
      {overlay === 'settings' && (
        <SettingsMenu
          onClose={() => setOverlay(null)}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(m => !m)}
          onPlayReplay={setReplaySession}
        />
      )}
      {replaySession && createPortal(
        <ReplayOverlay
          session={replaySession.session}
          meta={replaySession.meta}
          onClose={() => setReplaySession(null)}
        />,
        document.body
      )}
    </>
  );
}

export default App;
