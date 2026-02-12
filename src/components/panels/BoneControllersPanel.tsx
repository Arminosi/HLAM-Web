// ============================================================================
// Bone Controllers Panel
// Adjust bone controller values
// ============================================================================

import { useAppStore, useActiveModel } from '../../store';
import { useT } from '../../i18n';

export function BoneControllersPanel() {
  const model = useActiveModel();
  const animation = useAppStore((s) => s.animation);
  const setBoneController = useAppStore((s) => s.setBoneController);
  const t = useT();

  if (!model) {
    return <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">{t('noModelLoaded')}</div>;
  }

  if (model.boneControllers.length === 0) {
    return <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">{t('boneControllers')}: 0</div>;
  }

  return (
    <div className="space-y-4 p-3">
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('boneControllers')} ({model.boneControllers.length})
        </label>
        <div className="space-y-3">
          {model.boneControllers.map((ctrl, i) => {
            const bone = model.bones[ctrl.boneIndex];
            const isMouth = ctrl.index === 4;
            const value = animation.boneControllers[ctrl.index] ?? 128;

            return (
              <div key={i} className="bg-hlam-bg rounded p-2">
                <div className="text-xs text-hlam-text-dim mb-1">
                  {isMouth ? t('mouth') : `${t('controller')} ${ctrl.index}`} → {bone?.name ?? `Bone ${ctrl.boneIndex}`}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={isMouth ? 64 : 255}
                    value={value}
                    onChange={(e) => setBoneController(ctrl.index, Number(e.target.value))}
                    className="flex-1 accent-hlam-accent h-1.5"
                  />
                  <span className="text-xs font-mono w-8 text-right">{value}</span>
                </div>
                <div className="text-[10px] text-hlam-text-muted mt-1">
                  {t('range')}: {ctrl.start.toFixed(1)} → {ctrl.end.toFixed(1)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
