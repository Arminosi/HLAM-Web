// ============================================================================
// Menu Bar Component
// File, View, Tools, Help menus
// ============================================================================

import { useRef, useState } from 'react';
import { useAppStore } from '../../store';
import { parseStudioModel } from '../../formats/studiomodel';
import { useT, useI18nStore } from '../../i18n';
import { saveToHistory } from '../../store/fileHistory';

export function MenuBar() {
  const addAsset = useAppStore((s) => s.addAsset);
  const addMessage = useAppStore((s) => s.addMessage);
  const activeAssetId = useAppStore((s) => s.activeAssetId);
  const assets = useAppStore((s) => s.assets);
  const removeAsset = useAppStore((s) => s.removeAsset);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const t = useT();
  const setLocale = useI18nStore((s) => s.setLocale);

  const handleFileOpen = () => {
    fileInputRef.current?.click();
    setOpenMenu(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
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
        addMessage(`${t('loadedModel')}: ${file.name} (${model.bones.length} bones, ${model.sequences.length} sequences, ${model.textures.length} textures)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        addMessage(`${t('errorLoading')} ${file.name}: ${msg}`);
        alert(`${t('failedToLoad')} ${file.name}:\n${msg}`);
      }
    }

    // Reset input
    e.target.value = '';
  };

  const handleClose = () => {
    if (activeAssetId) {
      removeAsset(activeAssetId);
    }
    setOpenMenu(null);
  };

  const handleCloseAll = () => {
    for (const asset of [...assets]) {
      removeAsset(asset.id);
    }
    setOpenMenu(null);
  };

  const handleScreenshot = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    }
    setOpenMenu(null);
  };

  type MenuItem = { label: string; action?: () => void; shortcut?: string; disabled?: boolean };

  const menuItems: Record<string, MenuItem[]> = {
    [t('menuFile')]: [
      { label: t('menuOpenMdl'), action: handleFileOpen, shortcut: 'Ctrl+O' },
      { label: t('menuHistory'), action: () => { window.dispatchEvent(new Event('hlam-toggle-history')); setOpenMenu(null); } },
      { label: '---' },
      { label: t('menuClose'), action: handleClose, disabled: !activeAssetId },
      { label: t('menuCloseAll'), action: handleCloseAll, disabled: assets.length === 0 },
      { label: '---' },
      { label: t('menuScreenshot'), action: handleScreenshot },
    ],
    [t('menuView')]: [
      { label: t('menuFirstPerson'), action: () => { const s = useAppStore.getState(); s.setDisplayFlag('firstPerson', !s.displayFlags.firstPerson); setOpenMenu(null); }, shortcut: 'F5' },
      { label: '---' },
      { label: t('menuToggleMessages'), action: () => { useAppStore.getState().toggleMessages(); setOpenMenu(null); } },
    ],
    [t('menuLanguage')]: [
      { label: t('langZh'), action: () => { setLocale('zh'); setOpenMenu(null); } },
      { label: t('langEn'), action: () => { setLocale('en'); setOpenMenu(null); } },
    ],
    [t('menuHelp')]: [
      { label: t('menuAbout'), action: () => { alert(t('aboutText')); setOpenMenu(null); } },
      { label: t('menuGitHub'), action: () => { window.open('https://github.com/SamVanheer/HalfLifeAssetManager', '_blank'); setOpenMenu(null); } },
    ],
  };

  return (
    <div className="flex items-center h-8 bg-hlam-surface border-b border-hlam-border px-1 select-none relative z-50">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mdl"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Logo */}
      <div className="px-2 text-xs font-bold text-hlam-accent">HLAM</div>

      {/* Menus */}
      {Object.entries(menuItems).map(([name, items]) => (
        <div key={name} className="relative">
          <button
            className={`px-3 py-1 text-sm hover:bg-hlam-border/60 rounded-sm transition-colors ${openMenu === name ? 'bg-hlam-border/60' : ''}`}
            onClick={() => setOpenMenu(openMenu === name ? null : name)}
            onMouseEnter={() => openMenu && setOpenMenu(name)}
          >
            {name}
          </button>
          {openMenu === name && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />
              <div className="absolute top-full left-0 mt-0.5 bg-hlam-panel border border-hlam-border rounded shadow-xl min-w-[200px] py-1 z-50">
                {items.map((item, i) =>
                  item.label === '---' ? (
                    <div key={i} className="border-t border-hlam-border my-1" />
                  ) : (
                    <button
                      key={i}
                      className="w-full text-left px-3 py-1 text-sm hover:bg-hlam-accent/20 hover:text-hlam-accent disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-between"
                      onClick={item.action}
                      disabled={item.disabled}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-xs text-hlam-text-muted ml-4">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            </>
          )}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Quick actions */}
      <button
        className="px-2 py-0.5 text-xs bg-hlam-border/50 text-hlam-text-muted rounded hover:bg-hlam-border hover:text-hlam-text transition-colors mr-1"
        onClick={() => window.dispatchEvent(new Event('hlam-toggle-history'))}
        title={t('historyTitle')}
      >
        {t('historyButton')}
      </button>
      <button
        className="px-2 py-0.5 text-xs bg-hlam-accent/20 text-hlam-accent rounded hover:bg-hlam-accent/30 transition-colors mr-2"
        onClick={handleFileOpen}
      >
        {t('openMdlButton')}
      </button>
    </div>
  );
}
