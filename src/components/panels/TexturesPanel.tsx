// ============================================================================
// Textures Panel
// View and inspect model textures
// ============================================================================

import { useState, useRef, useEffect } from 'react';
import { useActiveModel } from '../../store';
import { TextureFlag } from '../../formats/studiomodel';
import { useT } from '../../i18n';

export function TexturesPanel() {
  const model = useActiveModel();
  const [selectedTexture, setSelectedTexture] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const t = useT();

  const texture = model?.textures[selectedTexture];

  // Draw texture preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !texture) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = texture.width;
    canvas.height = texture.height;

    const imageData = ctx.createImageData(texture.width, texture.height);
    const rgba = texture.rgba;
    if (rgba) {
      imageData.data.set(rgba);
    }
    ctx.putImageData(imageData, 0, 0);
  }, [texture]);

  if (!model) {
    return (
      <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">
        {t('noModelLoaded')}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      {/* Texture Selector */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('textures')} ({model.textures.length})
        </label>
        <select
          className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
          value={selectedTexture}
          onChange={(e) => setSelectedTexture(Number(e.target.value))}
        >
          {model.textures.map((tex, i) => (
            <option key={i} value={i}>
              [{i}] {tex.name} ({tex.width}×{tex.height})
            </option>
          ))}
        </select>
      </div>

      {/* Texture Preview */}
      {texture && (
        <>
          <div className="bg-hlam-bg rounded p-2 flex justify-center">
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-48 object-contain border border-hlam-border"
              style={{
                imageRendering: 'pixelated',
                width: Math.min(texture.width * 2, 280),
                height: Math.min(texture.height * 2, 192),
              }}
            />
          </div>

          {/* Texture Info */}
          <div>
            <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('textureInfo')}
            </label>
            <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-0.5">
              <div>{t('name')}: {texture.name}</div>
              <div>{t('size')}: {texture.width} × {texture.height}</div>
              <div>{t('flags')}: 0x{texture.flags.toString(16).padStart(4, '0')}</div>
              <div className="flex flex-wrap gap-1 mt-1">
                {(texture.flags & TextureFlag.FLATSHADE) !== 0 && <FlagBadge label="Flat" />}
                {(texture.flags & TextureFlag.CHROME) !== 0 && <FlagBadge label="Chrome" />}
                {(texture.flags & TextureFlag.FULLBRIGHT) !== 0 && <FlagBadge label="Fullbright" />}
                {(texture.flags & TextureFlag.ADDITIVE) !== 0 && <FlagBadge label="Additive" />}
                {(texture.flags & TextureFlag.MASKED) !== 0 && <FlagBadge label="Masked" />}
                {texture.flags === 0 && <FlagBadge label="None" />}
              </div>
            </div>
          </div>

          {/* Export button */}
          <button
            className="w-full px-3 py-1.5 rounded text-sm bg-hlam-surface border border-hlam-border hover:bg-hlam-border transition-colors"
            onClick={() => exportTexture(texture)}
          >
            {t('exportPng')}
          </button>
        </>
      )}
    </div>
  );
}

function FlagBadge({ label }: { label: string }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] bg-hlam-accent/20 text-hlam-accent">
      {label}
    </span>
  );
}

function exportTexture(texture: { name: string; width: number; height: number; rgba?: Uint8Array }) {
  if (!texture.rgba) return;

  const canvas = document.createElement('canvas');
  canvas.width = texture.width;
  canvas.height = texture.height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(texture.width, texture.height);
  imageData.data.set(texture.rgba);
  ctx.putImageData(imageData, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = texture.name.replace(/\.\w+$/, '') + '.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}
