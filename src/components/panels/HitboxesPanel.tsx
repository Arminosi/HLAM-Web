// ============================================================================
// Hitboxes Panel
// View and inspect hitbox data
// ============================================================================

import { useState } from 'react';
import { useActiveModel } from '../../store';
import { HitGroup } from '../../formats/studiomodel';
import { useT } from '../../i18n';

export function HitboxesPanel() {
  const model = useActiveModel();
  const [selected, setSelected] = useState(-1);
  const t = useT();

  const HITGROUP_NAMES: Record<number, string> = {
    [HitGroup.GENERIC]: t('hitGroupGeneric'),
    [HitGroup.HEAD]: t('hitGroupHead'),
    [HitGroup.CHEST]: t('hitGroupChest'),
    [HitGroup.STOMACH]: t('hitGroupStomach'),
    [HitGroup.LEFTARM]: t('hitGroupLeftArm'),
    [HitGroup.RIGHTARM]: t('hitGroupRightArm'),
    [HitGroup.LEFTLEG]: t('hitGroupLeftLeg'),
    [HitGroup.RIGHTLEG]: t('hitGroupRightLeg'),
  };

  if (!model) {
    return <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">{t('noModelLoaded')}</div>;
  }

  const hitbox = selected >= 0 ? model.hitboxes[selected] : undefined;

  return (
    <div className="space-y-4 p-3">
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('hitboxes')} ({model.hitboxes.length})
        </label>
        <select
          className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
          value={selected}
          onChange={(e) => setSelected(Number(e.target.value))}
          size={6}
        >
          {model.hitboxes.map((hb, i) => (
            <option key={i} value={i}>
              [{i}] Bone: {model.bones[hb.boneIndex]?.name ?? hb.boneIndex} ({HITGROUP_NAMES[hb.group] ?? `Group ${hb.group}`})
            </option>
          ))}
        </select>
      </div>

      {hitbox && (
        <div>
          <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('hitboxDetails')}
            </label>
          <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-1">
            <div>{t('index')}: {selected}</div>
            <div>{t('bone')}: [{hitbox.boneIndex}] {model.bones[hitbox.boneIndex]?.name}</div>
            <div>{t('group')}: {hitbox.group} ({HITGROUP_NAMES[hitbox.group] ?? 'Unknown'})</div>
            <div className="mt-1">BB Min: ({hitbox.bbmin.x.toFixed(2)}, {hitbox.bbmin.y.toFixed(2)}, {hitbox.bbmin.z.toFixed(2)})</div>
            <div>BB Max: ({hitbox.bbmax.x.toFixed(2)}, {hitbox.bbmax.y.toFixed(2)}, {hitbox.bbmax.z.toFixed(2)})</div>
          </div>
        </div>
      )}
    </div>
  );
}
