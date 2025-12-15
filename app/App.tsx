import React from 'react';
import { ChatProvider, useChat } from './contexts/ChatContext';
import CreateOrJoinRoom from './components/CreateOrJoinRoom';
import ChatRoom from './components/ChatRoom';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import CookieConsent from './components/CookieConsent';

const handleUpdate = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
  }
  window.location.reload();
};

const UpdateBanner: React.FC = () => {
  const { updateAvailable } = useChat();
  if (!updateAvailable) return null;

  return (
    <div className="bg-[#1A1A1A] border-b border-[#00FF41] text-white px-4 py-3 text-sm flex justify-between items-center shadow-lg z-50">
      <span className="flex items-center">
        <span className="w-2 h-2 bg-[#00FF41] rounded-full mr-3 animate-pulse shadow-[0_0_5px_#00FF41]"></span>
        <strong>System Update Available.</strong>&nbsp;New security protocols ready.
      </span>
      <button
        onClick={handleUpdate}
        className="bg-[#00FF41] text-black px-4 py-1 rounded-full text-xs font-bold hover:bg-[#00CC33] transition-colors shadow-[0_0_10px_rgba(0,255,65,0.3)]"
      >
        Initialize Update
      </button>
    </div>
  );
};

const ScaleWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scale, setScale] = React.useState(1);

  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const baseWidth = 375; // Standard mobile width
      // Only scale down, never up
      if (width < baseWidth) {
        setScale(width / baseWidth);
      } else {
        setScale(1);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const style: React.CSSProperties = {
    transform: `scale(${scale})`,
    transformOrigin: 'top left',
    width: `${100 / scale}%`,
    height: `${100 / scale}%`,
    overflow: 'hidden' // updated from 'auto' to 'hidden' to prevent double scrolling
  };

  return <div style={style}>{children}</div>;
};

const AppContent: React.FC = () => {
  const { roomId, activeChatTarget, updateRequired, chatEnded, resetChatEnded } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);


  // Chat Ended Check
  if (chatEnded) {
    return (
      <ScaleWrapper>
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#050505] text-white p-6 text-center animate-fade-in">
          <h1 className="text-4xl font-bold text-white mb-2">Chat Ended.</h1>
          <p className="text-sm italic text-[#86868b] mb-8">Let it be null.</p>
          <button
            onClick={resetChatEnded}
            className="px-6 py-2 bg-[#1A1A1A] hover:bg-[#333] text-white rounded-full transition-colors border border-[#333]"
          >
            Return to Home
          </button>
        </div>
      </ScaleWrapper>
    );
  }

  if (updateRequired) {
    return (
      <ScaleWrapper>
        <div className="flex flex-col items-center justify-center h-[100dvh] bg-[#050505] text-white p-6 text-center">
          <div className="bg-[#1A1A1A] p-10 rounded-[24px] border border-red-500/30 max-w-md shadow-2xl">
            <h1 className="text-3xl font-bold text-red-500 mb-4 tracking-tight">Critical Update Required</h1>
            <p className="text-[#86868b] mb-8 leading-relaxed">
              Your client version is deprecated. <br />
              Security protocols require an immediate update to continue.
            </p>
            <button
              onClick={handleUpdate}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-full font-bold transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)]"
            >
              Install Update
            </button>
          </div>
        </div>
      </ScaleWrapper>
    );
  }

  return (
    <ScaleWrapper>
      <div
        className="flex flex-col h-[100dvh] bg-[#050505] text-[#F5F5F7] overflow-hidden"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingRight: 'env(safe-area-inset-right)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'calc(10pt + env(safe-area-inset-left))'
        }}
      >
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Soft Update Banner */}
        <UpdateBanner />

        <div className="flex flex-grow overflow-hidden relative">
          {roomId && (
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
            />
          )}

          <main className="flex-grow flex flex-col relative w-full">
            {!roomId ? (
              <div className="flex-grow flex items-center justify-center p-4 bg-[#050505]">
                <CreateOrJoinRoom />
              </div>
            ) : (
              <ChatRoom key={`${roomId}-${activeChatTarget || 'ROOM'}`} />
            )}
          </main>
        </div>

        {!roomId && <Footer />}
      </div>
    </ScaleWrapper>
  );
};

import NexusStatus from './components/NexusStatus';

const App: React.FC = () => {
  const [showNexusStatus, setShowNexusStatus] = React.useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('status') === 'true';
  });

  if (showNexusStatus) {
    return (
      <ChatProvider>
        <NexusStatus onBack={() => setShowNexusStatus(false)} />
      </ChatProvider>
    );
  }

  return (
    <ChatProvider>
      <AppContent />
      <CookieConsent />
    </ChatProvider>
  );
};

export default App;
