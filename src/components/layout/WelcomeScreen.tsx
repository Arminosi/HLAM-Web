// ============================================================================
// Welcome / Drop Zone Screen
// Shown when no model is loaded
// ============================================================================

import { useCallback, useState } from 'react';
import { useAppStore } from '../../store';
import { parseStudioModel } from '../../formats/studiomodel';
import { useT } from '../../i18n';
import { saveToHistory } from '../../store/fileHistory';

export function WelcomeScreen() {
  const addAsset = useAppStore((s) => s.addAsset);
  const addMessage = useAppStore((s) => s.addMessage);
  const [isDragging, setIsDragging] = useState(false);
  const t = useT();

  const handleFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        if (!file.name.toLowerCase().endsWith('.mdl')) {
          addMessage(`${t('skippedNonMdl')}: ${file.name}`);
          continue;
        }
        try {
          const buffer = await file.arrayBuffer();
          const model = parseStudioModel(buffer);
          const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          addAsset({
            id,
            fileName: file.name,
            model,
            dirty: false,
          });
          saveToHistory(file.name, buffer).catch(() => {});
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          addMessage(`${t('errorLoading')} ${file.name}: ${msg}`);
        }
      }
    },
    [addAsset, addMessage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className="flex-1 flex items-center justify-center"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={`
          w-96 h-64 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center
          transition-all duration-200 select-none
          ${isDragging
            ? 'border-hlam-accent bg-hlam-accent/10 scale-105'
            : 'border-hlam-border bg-hlam-surface/30 hover:border-hlam-text-muted'
          }
        `}
      >
        <div className="text-5xl mb-4">
          {isDragging ? '📂' : '🎮'}
        </div>
        <h2 className="text-lg font-semibold text-hlam-text mb-2">
          {t('welcomeTitle')}
        </h2>
        <p className="text-sm text-hlam-text-dim mb-1">{t('welcomeSubtitle')}</p>
        <p className="text-xs text-hlam-text-muted mt-4">
          {t('welcomeDropHint')} <span className="text-hlam-accent font-mono">.mdl</span> {t('welcomeDropHint2')}{' '}
          <span className="text-hlam-accent">{t('welcomeDropHint3')}</span>
        </p>
        <p className="text-[10px] text-hlam-text-muted mt-2">
          {t('welcomeFormatNote')}
        </p>
      </div>
    </div>
  );
}
