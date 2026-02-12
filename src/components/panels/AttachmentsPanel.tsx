// ============================================================================
// Attachments Panel
// View attachment point data
// ============================================================================

import { useState } from 'react';
import { useActiveModel } from '../../store';
import { useT } from '../../i18n';

export function AttachmentsPanel() {
  const model = useActiveModel();
  const [selected, setSelected] = useState(-1);
  const t = useT();

  if (!model) {
    return <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">{t('noModelLoaded')}</div>;
  }

  const attachment = selected >= 0 ? model.attachments[selected] : undefined;

  return (
    <div className="space-y-4 p-3">
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('attachments')} ({model.attachments.length})
        </label>
        {model.attachments.length > 0 ? (
          <select
            className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
            value={selected}
            onChange={(e) => setSelected(Number(e.target.value))}
            size={6}
          >
            {model.attachments.map((att, i) => (
              <option key={i} value={i}>
                [{i}] {att.name || `Attachment ${i}`} → Bone: {model.bones[att.boneIndex]?.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-hlam-text-muted px-2">{t('noAttachments')}</div>
        )}
      </div>

      {attachment && (
        <div>
          <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('attachmentDetails')}
            </label>
          <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-1">
            <div>{t('name')}: {attachment.name}</div>
            <div>{t('index')}: {selected}</div>
            <div>{t('bone')}: [{attachment.boneIndex}] {model.bones[attachment.boneIndex]?.name}</div>
            <div>{t('type')}: {attachment.type}</div>
            <div className="mt-1">{t('origin')}: ({attachment.origin.x.toFixed(2)}, {attachment.origin.y.toFixed(2)}, {attachment.origin.z.toFixed(2)})</div>
          </div>
        </div>
      )}
    </div>
  );
}
