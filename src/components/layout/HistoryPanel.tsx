// ============================================================================
// History Panel — Modal overlay showing recently opened MDL files
// ============================================================================

import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '../../store';
import { parseStudioModel } from '../../formats/studiomodel';
import {
  getHistoryMeta,
  loadFromHistory,
  removeFromHistory,
  clearHistory,
  type HistoryMeta,
} from '../../store/fileHistory';
import { useT } from '../../i18n';

interface HistoryPanelProps {
  onClose: () => void;
}

export function HistoryPanel({ onClose }: HistoryPanelProps) {
  const addAsset = useAppStore((s) => s.addAsset);
  const addMessage = useAppStore((s) => s.addMessage);
  const t = useT();

  const [entries, setEntries] = useState<HistoryMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Load history on mount
  const refresh = useCallback(async () => {
    try {
      const metas = await getHistoryMeta();
      setEntries(metas);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Open a file from history
  const handleOpen = useCallback(
    async (fileName: string) => {
      try {
        const data = await loadFromHistory(fileName);
        if (!data) {
          addMessage(`${t('historyLoadFail')}: ${fileName}`);
          return;
        }
        const model = parseStudioModel(data);
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        addAsset({ id, fileName, model, dirty: false });
        addMessage(`${t('loadedModel')}: ${fileName}`);
        onClose();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addMessage(`${t('errorLoading')} ${fileName}: ${msg}`);
      }
    },
    [addAsset, addMessage, onClose, t]
  );

  // Delete single entry
  const handleRemove = useCallback(
    async (e: React.MouseEvent, fileName: string) => {
      e.stopPropagation();
      await removeFromHistory(fileName);
      refresh();
    },
    [refresh]
  );

  // Clear all history
  const handleClearAll = useCallback(async () => {
    await clearHistory();
    refresh();
  }, [refresh]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatTime(ts: number): string {
    const d = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - ts;
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return t('historyJustNow');
    if (diffMin < 60) return `${diffMin} ${t('historyMinAgo')}`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)} ${t('historyHourAgo')}`;

    // Same year → shorter format
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-96 max-w-full bg-hlam-panel border-l border-hlam-border shadow-2xl z-[101] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-hlam-border">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <span>📋</span>
            {t('historyTitle')}
            {entries.length > 0 && (
              <span className="text-xs text-hlam-text-muted">({entries.length})</span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {entries.length > 0 && (
              <button
                className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                onClick={handleClearAll}
                title={t('historyClearAll')}
              >
                {t('historyClearAll')}
              </button>
            )}
            <button
              className="text-hlam-text-muted hover:text-hlam-text text-lg leading-none"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-hlam-text-muted text-sm">
              {t('historyLoading')}
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-hlam-text-muted text-sm">
              <span className="text-2xl mb-2">📭</span>
              {t('historyEmpty')}
            </div>
          ) : (
            <ul className="py-1">
              {entries.map((entry) => (
                <li key={entry.fileName}>
                  <button
                    className="w-full text-left px-4 py-2.5 hover:bg-hlam-accent/10 transition-colors flex items-center gap-3 group"
                    onClick={() => handleOpen(entry.fileName)}
                  >
                    <span className="text-lg shrink-0">
                      {entry.fileName.toLowerCase().startsWith('v_') ? '🔫' : '🧟'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-hlam-text truncate">
                        {entry.fileName}
                      </div>
                      <div className="text-[11px] text-hlam-text-muted flex items-center gap-2 mt-0.5">
                        <span>{formatSize(entry.size)}</span>
                        <span>·</span>
                        <span>{formatTime(entry.lastOpened)}</span>
                      </div>
                    </div>
                    <button
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-hlam-text-muted hover:text-red-400 text-xs p-1 transition-all"
                      onClick={(e) => handleRemove(e, entry.fileName)}
                      title={t('historyRemove')}
                    >
                      🗑
                    </button>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
