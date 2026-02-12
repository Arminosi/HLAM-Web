// ============================================================================
// Body Parts Panel
// Body part / sub-model selection and skin switching
// ============================================================================

import { useAppStore, useActiveModel } from '../../store';
import { useT } from '../../i18n';

export function BodyPartsPanel() {
  const model = useActiveModel();
  const bodyValue = useAppStore((s) => s.bodyValue);
  const skinFamily = useAppStore((s) => s.skinFamily);
  const setBodyValue = useAppStore((s) => s.setBodyValue);
  const setSkinFamily = useAppStore((s) => s.setSkinFamily);
  const t = useT();

  if (!model) return <EmptyPanel />;

  // Calculate current sub-model indices per bodypart
  const bodypartStates = model.bodyparts.map((bp) => {
    if (bp.models.length <= 1) return 0;
    return Math.floor(bodyValue / bp.base) % bp.models.length;
  });

  const handleBodypartChange = (bpIndex: number, modelIndex: number) => {
    const bp = model.bodyparts[bpIndex]!;
    let newBodyValue = bodyValue;
    const current = Math.floor(newBodyValue / bp.base) % bp.models.length;
    newBodyValue -= current * bp.base;
    newBodyValue += modelIndex * bp.base;
    setBodyValue(newBodyValue);
  };

  return (
    <div className="space-y-4 p-3">
      {/* Bodyparts */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('bodyParts')} ({model.bodyparts.length})
        </label>
        {model.bodyparts.map((bp, bpIdx) => (
          <div key={bpIdx} className="mb-2">
            <div className="text-xs text-hlam-text-dim mb-0.5">{bp.name || `Part ${bpIdx}`}</div>
            {bp.models.length > 1 ? (
              <select
                className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1 text-sm"
                value={bodypartStates[bpIdx]}
                onChange={(e) => handleBodypartChange(bpIdx, Number(e.target.value))}
              >
                {bp.models.map((m, mIdx) => (
                  <option key={mIdx} value={mIdx}>
                    [{mIdx}] {m.name || `Model ${mIdx}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-sm text-hlam-text-muted px-2">
                {bp.models[0]?.name || t('singleModel')}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Skins */}
      {model.skinFamilies.length > 1 && (
        <div>
          <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
            {t('skin')} ({model.skinFamilies.length} {t('skinFamilies')})
          </label>
          <select
            className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
            value={skinFamily}
            onChange={(e) => setSkinFamily(Number(e.target.value))}
          >
            {model.skinFamilies.map((_, i) => (
              <option key={i} value={i}>Skin {i}</option>
            ))}
          </select>
        </div>
      )}

      {/* Body Value */}
      <div className="bg-hlam-bg rounded p-2 text-xs font-mono">
        <div>{t('bodyValue')}: {bodyValue}</div>
        <div>{t('skinFamily')}: {skinFamily}</div>
      </div>
    </div>
  );
}

function EmptyPanel() {
  const t = useT();
  return (
    <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">
      {t('noModelLoaded')}
    </div>
  );
}
