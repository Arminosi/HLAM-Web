// ============================================================================
// Model Display Panel
// Controls render mode, display toggles, and visualization overlays
// ============================================================================

import { useAppStore } from '../../store';
import { RenderMode } from '../../renderer';
import { useT } from '../../i18n';

export function ModelDisplayPanel() {
  const renderMode = useAppStore((s) => s.renderMode);
  const displayFlags = useAppStore((s) => s.displayFlags);
  const setRenderMode = useAppStore((s) => s.setRenderMode);
  const setDisplayFlag = useAppStore((s) => s.setDisplayFlag);
  const colors = useAppStore((s) => s.colors);
  const setColor = useAppStore((s) => s.setColor);
  const t = useT();

  const RENDER_MODES = [
    { value: RenderMode.TEXTURED, label: t('renderTextured') },
    { value: RenderMode.WIREFRAME, label: t('renderWireframe') },
    { value: RenderMode.FLAT_SHADED, label: t('renderFlatShaded') },
    { value: RenderMode.SMOOTH_SHADED, label: t('renderSmoothShaded') },
  ];

  return (
    <div className="space-y-4 p-3">
      {/* Render Mode */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('renderMode')}
        </label>
        <select
          className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
          value={renderMode}
          onChange={(e) => setRenderMode(e.target.value as RenderMode)}
        >
          {RENDER_MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Display Toggles */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('displayOptions')}
        </label>
        <div className="space-y-1.5">
          <ToggleRow label={t('backfaceCulling')} checked={displayFlags.backfaceCulling}
            onChange={(v) => setDisplayFlag('backfaceCulling', v)} />
          <ToggleRow label={t('wireframeOverlay')} checked={displayFlags.showWireframeOverlay}
            onChange={(v) => setDisplayFlag('showWireframeOverlay', v)} />
          <ToggleRow label={t('showBones')} checked={displayFlags.showBones}
            onChange={(v) => setDisplayFlag('showBones', v)} />
          <ToggleRow label={t('showHitboxes')} checked={displayFlags.showHitboxes}
            onChange={(v) => setDisplayFlag('showHitboxes', v)} />
          <ToggleRow label={t('showAttachments')} checked={displayFlags.showAttachments}
            onChange={(v) => setDisplayFlag('showAttachments', v)} />
          <ToggleRow label={t('showNormals')} checked={displayFlags.showNormals}
            onChange={(v) => setDisplayFlag('showNormals', v)} />
          <ToggleRow label={t('boundingBox')} checked={displayFlags.showBoundingBox}
            onChange={(v) => setDisplayFlag('showBoundingBox', v)} />
        </div>
      </div>

      {/* Camera */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('camera')}
        </label>
        <div className="space-y-1.5">
          <ToggleRow label={t('firstPersonView')} checked={displayFlags.firstPerson}
            onChange={(v) => setDisplayFlag('firstPerson', v)} />
        </div>
      </div>

      {/* Scene Options */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('scene')}
        </label>
        <div className="space-y-1.5">
          <ToggleRow label={t('showGround')} checked={displayFlags.showGround}
            onChange={(v) => setDisplayFlag('showGround', v)} />
          <ToggleRow label={t('showGrid')} checked={displayFlags.showGrid}
            onChange={(v) => setDisplayFlag('showGrid', v)} />
          <ToggleRow label={t('showShadow')} checked={displayFlags.showShadow}
            onChange={(v) => setDisplayFlag('showShadow', v)} />
          <ToggleRow label={t('showAxes')} checked={displayFlags.showAxes}
            onChange={(v) => setDisplayFlag('showAxes', v)} />
          <ToggleRow label={t('showCrosshair')} checked={displayFlags.showCrosshair}
            onChange={(v) => setDisplayFlag('showCrosshair', v)} />
        </div>
      </div>

      {/* Background Color */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-2 block">
          {t('backgroundColor')}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={colors.background}
            onChange={(e) => setColor('background', e.target.value)}
            className="w-8 h-8 rounded border border-hlam-border cursor-pointer bg-transparent p-0"
          />
          <input
            type="text"
            value={colors.background}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9a-fA-F]{6}$/.test(v)) setColor('background', v);
            }}
            className="flex-1 bg-hlam-bg border border-hlam-border rounded px-2 py-1 text-sm font-mono"
            maxLength={7}
          />
          <button
            className="text-xs bg-hlam-surface border border-hlam-border rounded px-2 py-1 hover:bg-hlam-accent/20 transition-colors"
            onClick={() => setColor('background', '#1e1e2e')}
            title={t('resetDefault')}
          >
            ↺
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer hover:bg-hlam-surface rounded px-1 py-0.5 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-hlam-border bg-hlam-bg accent-hlam-accent w-3.5 h-3.5"
      />
      <span className="text-sm select-none">{label}</span>
    </label>
  );
}
