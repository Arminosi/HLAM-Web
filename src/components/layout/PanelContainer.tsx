// ============================================================================
// Panel Container (Side Panel with Tabs)
// Contains all the editing dock panels
// ============================================================================

import { useAppStore } from '../../store';
import { useT } from '../../i18n';
import {
  ModelDisplayPanel,
  SequencesPanel,
  BodyPartsPanel,
  BonesPanel,
  BoneControllersPanel,
  TexturesPanel,
  HitboxesPanel,
  AttachmentsPanel,
  ModelDataPanel,
} from '../panels';

const PANELS = [
  { id: 'model-display', labelKey: 'panelDisplay' as const, icon: '🎨' },
  { id: 'sequences', labelKey: 'panelSequences' as const, icon: '🎬' },
  { id: 'bodyparts', labelKey: 'panelBodyParts' as const, icon: '🦴' },
  { id: 'bones', labelKey: 'panelBones' as const, icon: '🦷' },
  { id: 'controllers', labelKey: 'panelControllers' as const, icon: '🎛' },
  { id: 'textures', labelKey: 'panelTextures' as const, icon: '🖼' },
  { id: 'hitboxes', labelKey: 'panelHitboxes' as const, icon: '📦' },
  { id: 'attachments', labelKey: 'panelAttachments' as const, icon: '📌' },
  { id: 'model-data', labelKey: 'panelModelInfo' as const, icon: 'ℹ' },
];

export function PanelContainer() {
  const activePanel = useAppStore((s) => s.activePanel);
  const setActivePanel = useAppStore((s) => s.setActivePanel);
  const t = useT();

  return (
    <div className="flex flex-col h-full bg-hlam-panel">
      {/* Panel tabs */}
      <div className="flex flex-wrap bg-hlam-surface border-b border-hlam-border">
        {PANELS.map((panel) => (
          <button
            key={panel.id}
            className={`
              px-2 py-1.5 text-[11px] transition-colors whitespace-nowrap
              ${activePanel === panel.id
                ? 'bg-hlam-panel text-hlam-accent border-b-2 border-b-hlam-accent'
                : 'text-hlam-text-dim hover:text-hlam-text hover:bg-hlam-bg/50'
              }
            `}
            onClick={() => setActivePanel(panel.id)}
            title={t(panel.labelKey)}
          >
            <span className="mr-0.5">{panel.icon}</span>
            <span className="hidden lg:inline">{t(panel.labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activePanel === 'model-display' && <ModelDisplayPanel />}
        {activePanel === 'sequences' && <SequencesPanel />}
        {activePanel === 'bodyparts' && <BodyPartsPanel />}
        {activePanel === 'bones' && <BonesPanel />}
        {activePanel === 'controllers' && <BoneControllersPanel />}
        {activePanel === 'textures' && <TexturesPanel />}
        {activePanel === 'hitboxes' && <HitboxesPanel />}
        {activePanel === 'attachments' && <AttachmentsPanel />}
        {activePanel === 'model-data' && <ModelDataPanel />}
      </div>
    </div>
  );
}
