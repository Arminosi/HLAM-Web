// ============================================================================
// App Root Component
// Main application layout: MenuBar + TabBar + [Viewport | Panels] + Messages
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from './store';
import { parseStudioModel } from './formats/studiomodel';
import { MenuBar, AssetTabBar, PanelContainer, MessagesPanel, WelcomeScreen } from './components/layout';
import { Viewport3D } from './components/viewport/Viewport3D';
import { HistoryPanel } from './components/layout/HistoryPanel';
import { saveToHistory } from './store/fileHistory';

export function App() {
  const activeAssetId = useAppStore((s) => s.activeAssetId);
  const addAsset = useAppStore((s) => s.addAsset);
  const addMessage = useAppStore((s) => s.addMessage);
  const hasActiveModel = activeAssetId !== null;
  const [showHistory, setShowHistory] = useState(false);

  // Listen for history toggle events from MenuBar
  useEffect(() => {
    const handler = () => setShowHistory((v) => !v);
    window.addEventListener('hlam-toggle-history', handler);
    return () => window.removeEventListener('hlam-toggle-history', handler);
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'o') {
        e.preventDefault();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        input?.click();
      }
      // F5: toggle first-person view
      if (e.key === 'F5') {
        e.preventDefault();
        const s = useAppStore.getState();
        s.setDisplayFlag('firstPerson', !s.displayFlags.firstPerson);
      }
      // Escape: exit first-person view
      if (e.key === 'Escape') {
        const s = useAppStore.getState();
        if (s.displayFlags.firstPerson) {
          e.preventDefault();
          s.setDisplayFlag('firstPerson', false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global drag & drop
  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files) return;

      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.mdl')) continue;
        try {
          const buffer = await file.arrayBuffer();
          const model = parseStudioModel(buffer);
          const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          addAsset({ id, fileName: file.name, model, dirty: false });
          saveToHistory(file.name, buffer).catch(() => {});
        } catch (err) {
          addMessage(`Error: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    },
    [addAsset, addMessage]
  );

  useEffect(() => {
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDrop]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-hlam-bg text-hlam-text">
      {/* Menu Bar */}
      <MenuBar />

      {/* Tab Bar */}
      <AssetTabBar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {hasActiveModel ? (
          <>
            {/* 3D Viewport */}
            <div className="flex-1 relative">
              <Viewport3D />
            </div>

            {/* Right Panel */}
            <div className="w-80 min-w-[280px] max-w-[400px] border-l border-hlam-border overflow-hidden">
              <PanelContainer />
            </div>
          </>
        ) : (
          <WelcomeScreen />
        )}
      </div>

      {/* Messages Panel */}
      <MessagesPanel />

      {/* History Panel */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}

      {/* Status Bar */}
      <StatusBar />
    </div>
  );
}

function StatusBar() {
  const assets = useAppStore((s) => s.assets);
  const activeAssetId = useAppStore((s) => s.activeAssetId);
  const showMessages = useAppStore((s) => s.showMessages);
  const toggleMessages = useAppStore((s) => s.toggleMessages);
  const messageLog = useAppStore((s) => s.messageLog);
  const activeAsset = assets.find((a) => a.id === activeAssetId);

  return (
    <div className="flex items-center h-6 bg-hlam-surface border-t border-hlam-border px-3 text-[11px] text-hlam-text-muted select-none">
      <span className="mr-4">
        {activeAsset ? activeAsset.fileName : 'No model loaded'}
      </span>
      <span className="mr-4">
        Assets: {assets.length}
      </span>
      <div className="flex-1" />
      <button
        className="hover:text-hlam-text transition-colors"
        onClick={toggleMessages}
      >
        {showMessages ? '▼' : '▲'} Messages ({messageLog.length})
      </button>
    </div>
  );
}
