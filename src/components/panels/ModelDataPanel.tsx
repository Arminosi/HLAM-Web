// ============================================================================
// Model Data Panel
// Global model properties (flags, eye position, bounding boxes)
// ============================================================================

import { useActiveModel } from '../../store';
import { ModelFlag } from '../../formats/studiomodel';
import { useT } from '../../i18n';

export function ModelDataPanel() {
  const model = useActiveModel();
  const t = useT();

  const FLAG_NAMES: [number, string][] = [
    [ModelFlag.ROCKET, t('flagRocketTrail')],
    [ModelFlag.GRENADE, t('flagGrenadeTrail')],
    [ModelFlag.GIB, t('flagGibTrail')],
    [ModelFlag.ROTATE, t('flagRotate')],
    [ModelFlag.TRACER, t('flagTracerGreen')],
    [ModelFlag.ZOMGIB, t('flagZombieGib')],
    [ModelFlag.TRACER2, t('flagTracerOrange')],
    [ModelFlag.TRACER3, t('flagTracerPurple')],
    [ModelFlag.NOSHADELIGHT, t('flagNoShadeLight')],
    [ModelFlag.HITBOXCOLLISIONS, t('flagHitboxCollisions')],
    [ModelFlag.FORCESKYLIGHT, t('flagForceSkylight')],
  ];

  if (!model) {
    return <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">{t('noModelLoaded')}</div>;
  }

  return (
    <div className="space-y-4 p-3">
      {/* General Info */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('modelInfo')}
        </label>
        <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-0.5">
          <div>{t('name')}: {model.name}</div>
          <div>{t('bones')}: {model.bones.length}</div>
          <div>{t('boneControllers')}: {model.boneControllers.length}</div>
          <div>{t('hitboxes')}: {model.hitboxes.length}</div>
          <div>{t('sequence')}: {model.sequences.length}</div>
          <div>{t('bodyParts')}: {model.bodyparts.length}</div>
          <div>{t('textures')}: {model.textures.length}</div>
          <div>{t('attachments')}: {model.attachments.length}</div>
          <div>{t('skinFamilies')}: {model.skinFamilies.length}</div>
        </div>
      </div>

      {/* Eye Position */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('eyePosition')}
        </label>
        <div className="bg-hlam-bg rounded p-2 text-xs font-mono">
          ({model.eyePosition.x.toFixed(2)}, {model.eyePosition.y.toFixed(2)}, {model.eyePosition.z.toFixed(2)})
        </div>
      </div>

      {/* Bounding Boxes */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('boundingBoxMovement')}
        </label>
        <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-0.5">
          <div>{t('min')}: ({model.boundingMin.x.toFixed(2)}, {model.boundingMin.y.toFixed(2)}, {model.boundingMin.z.toFixed(2)})</div>
          <div>{t('max')}: ({model.boundingMax.x.toFixed(2)}, {model.boundingMax.y.toFixed(2)}, {model.boundingMax.z.toFixed(2)})</div>
        </div>
      </div>

      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('clippingBox')}
        </label>
        <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-0.5">
          <div>{t('min')}: ({model.clippingMin.x.toFixed(2)}, {model.clippingMin.y.toFixed(2)}, {model.clippingMin.z.toFixed(2)})</div>
          <div>{t('max')}: ({model.clippingMax.x.toFixed(2)}, {model.clippingMax.y.toFixed(2)}, {model.clippingMax.z.toFixed(2)})</div>
        </div>
      </div>

      {/* Flags */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('flags')} (0x{model.flags.toString(16).padStart(4, '0')})
        </label>
        <div className="bg-hlam-bg rounded p-2 space-y-1">
          {FLAG_NAMES.map(([flag, name]) => (
            <label key={flag} className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={(model.flags & flag) !== 0}
                readOnly
                className="rounded border-hlam-border bg-hlam-bg accent-hlam-accent w-3 h-3"
              />
              <span className={`${(model.flags & flag) !== 0 ? 'text-hlam-text' : 'text-hlam-text-muted'}`}>
                {name}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
