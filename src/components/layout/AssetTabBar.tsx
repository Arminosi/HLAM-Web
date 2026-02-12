// ============================================================================
// Asset Tab Bar
// Tabs for opened model assets
// ============================================================================

import { useAppStore } from '../../store';
import { useT } from '../../i18n';

export function AssetTabBar() {
  const assets = useAppStore((s) => s.assets);
  const activeAssetId = useAppStore((s) => s.activeAssetId);
  const setActiveAsset = useAppStore((s) => s.setActiveAsset);
  const removeAsset = useAppStore((s) => s.removeAsset);
  const t = useT();

  if (assets.length === 0) return null;

  return (
    <div className="flex items-center h-8 bg-hlam-surface border-b border-hlam-border overflow-x-auto">
      {assets.map((asset) => (
        <div
          key={asset.id}
          className={`
            flex items-center gap-1 px-3 py-1 text-sm cursor-pointer border-r border-hlam-border
            transition-colors whitespace-nowrap min-w-0
            ${asset.id === activeAssetId
              ? 'bg-hlam-bg text-hlam-text border-b-2 border-b-hlam-accent'
              : 'text-hlam-text-dim hover:bg-hlam-bg/50'
            }
          `}
          onClick={() => setActiveAsset(asset.id)}
        >
          <span className="truncate max-w-[150px]">
            {asset.dirty ? '● ' : ''}{asset.fileName}
          </span>
          <button
            className="ml-1 w-4 h-4 rounded flex items-center justify-center text-xs hover:bg-hlam-border/80 text-hlam-text-muted hover:text-hlam-error"
            onClick={(e) => {
              e.stopPropagation();
              removeAsset(asset.id);
            }}
            title={t('close')}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
