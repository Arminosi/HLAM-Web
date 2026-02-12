// ============================================================================
// Bones Panel
// View bone hierarchy and properties
// ============================================================================

import { useState } from 'react';
import { useActiveModel } from '../../store';
import { useT } from '../../i18n';

export function BonesPanel() {
  const model = useActiveModel();
  const [selectedBone, setSelectedBone] = useState<number>(-1);
  const t = useT();

  if (!model) return <EmptyPanel />;

  const bone = selectedBone >= 0 ? model.bones[selectedBone] : undefined;

  return (
    <div className="space-y-4 p-3">
      {/* Bone Selector */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('bones')} ({model.bones.length})
        </label>
        <select
          className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
          value={selectedBone}
          onChange={(e) => setSelectedBone(Number(e.target.value))}
          size={8}
        >
          {model.bones.map((b, i) => (
            <option key={i} value={i}>
              [{i}] {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Bone Details */}
      {bone && (
        <div>
          <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('boneDetails')}
            </label>
          <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-1">
            <div>{t('name')}: {bone.name}</div>
            <div>{t('index')}: {selectedBone}</div>
            <div>
              {t('parent')}: {bone.parentIndex >= 0 ? `[${bone.parentIndex}] ${model.bones[bone.parentIndex]?.name}` : t('noneRoot')}
            </div>
            <div>{t('flags')}: 0x{bone.flags.toString(16).padStart(4, '0')}</div>
            <div className="mt-2 text-hlam-text-dim">{t('axisValues')}</div>
            {['X', 'Y', 'Z', 'XR', 'YR', 'ZR'].map((label, i) => {
              const axis = bone.axes[i];
              if (!axis) return null;
              return (
                <div key={i} className="flex gap-2">
                  <span className="w-6">{label}</span>
                  <span>val={axis.value.toFixed(4)}</span>
                  <span>scale={axis.scale.toFixed(6)}</span>
                  <span>ctrl={axis.controllerId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bone hierarchy (simplified tree) */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('hierarchy')}
        </label>
        <div className="bg-hlam-bg rounded p-2 text-xs font-mono max-h-48 overflow-y-auto">
          {model.bones
            .filter((b) => b.parentIndex === -1)
            .map((rootBone) => {
              const rootIdx = model.bones.indexOf(rootBone);
              return (
                <BoneTreeNode
                  key={rootIdx}
                  bones={model.bones}
                  index={rootIdx}
                  depth={0}
                  selectedBone={selectedBone}
                  onSelect={setSelectedBone}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

function BoneTreeNode({
  bones,
  index,
  depth,
  selectedBone,
  onSelect,
}: {
  bones: { name: string; parentIndex: number }[];
  index: number;
  depth: number;
  selectedBone: number;
  onSelect: (i: number) => void;
}) {
  const bone = bones[index]!;
  const children = bones
    .map((b, i) => ({ bone: b, index: i }))
    .filter((b) => b.bone.parentIndex === index);

  return (
    <div>
      <div
        className={`cursor-pointer hover:bg-hlam-surface rounded px-1 py-0.5 ${selectedBone === index ? 'bg-hlam-accent/20 text-hlam-accent' : ''}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => onSelect(index)}
      >
        {children.length > 0 ? '▸ ' : '  '}{bone.name}
      </div>
      {children.map((child) => (
        <BoneTreeNode
          key={child.index}
          bones={bones}
          index={child.index}
          depth={depth + 1}
          selectedBone={selectedBone}
          onSelect={onSelect}
        />
      ))}
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
