// ============================================================================
// Sequences Panel
// Sequence selection, playback controls, blend settings, events list
// ============================================================================

import { useAppStore, useActiveModel } from '../../store';
import { useT } from '../../i18n';

export function SequencesPanel() {
  const model = useActiveModel();
  const animation = useAppStore((s) => s.animation);
  const setSequenceIndex = useAppStore((s) => s.setSequenceIndex);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setPlaybackRate = useAppStore((s) => s.setPlaybackRate);
  const setFrame = useAppStore((s) => s.setFrame);
  const setBlender = useAppStore((s) => s.setBlender);
  const setLoopOverride = useAppStore((s) => s.setLoopOverride);
  const t = useT();

  if (!model) return <EmptyPanel message={t('noModelLoaded')} />;

  const currentSeq = model.sequences[animation.sequenceIndex];

  return (
    <div className="space-y-4 p-3">
      {/* Sequence Selector */}
      <div>
        <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
          {t('sequence')} ({model.sequences.length})
        </label>
        <select
          className="w-full bg-hlam-bg border border-hlam-border rounded px-2 py-1.5 text-sm"
          value={animation.sequenceIndex}
          onChange={(e) => setSequenceIndex(Number(e.target.value))}
        >
          {model.sequences.map((seq, i) => (
            <option key={i} value={i}>
              [{i}] {seq.label}
            </option>
          ))}
        </select>
      </div>

      {/* Playback Controls */}
      {currentSeq && (
        <>
          <div>
            <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('playback')}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                className="px-3 py-1 rounded text-sm bg-hlam-surface border border-hlam-border hover:bg-hlam-border transition-colors"
                onClick={() => setPlaying(!animation.playing)}
              >
                {animation.playing ? `⏸ ${t('pause')}` : `▶ ${t('play')}`}
              </button>
              <button
                className="px-3 py-1 rounded text-sm bg-hlam-surface border border-hlam-border hover:bg-hlam-border transition-colors"
                onClick={() => setFrame(0)}
              >
                ⏮ {t('resetBtn')}
              </button>
            </div>

            {/* Frame slider */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-hlam-text-dim w-10">{t('frame')}</span>
              <input
                type="range"
                min={0}
                max={Math.max(0, currentSeq.numFrames - 1)}
                step={0.1}
                value={animation.frame}
                onChange={(e) => setFrame(Number(e.target.value))}
                className="flex-1 accent-hlam-accent h-1.5"
              />
              <span className="text-xs font-mono w-16 text-right">
                {Math.floor(animation.frame)}/{currentSeq.numFrames - 1}
              </span>
            </div>

            {/* Speed control */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-hlam-text-dim w-10">{t('speed')}</span>
              <input
                type="range"
                min={0}
                max={5}
                step={0.1}
                value={animation.playbackRate}
                onChange={(e) => setPlaybackRate(Number(e.target.value))}
                className="flex-1 accent-hlam-accent h-1.5"
              />
              <span className="text-xs font-mono w-16 text-right">
                {animation.playbackRate.toFixed(1)}×
              </span>
            </div>

            {/* Loop control */}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-hlam-text-dim w-10">{t('looping')}</span>
              <select
                className="flex-1 bg-hlam-bg border border-hlam-border rounded px-2 py-1 text-xs"
                value={animation.loopOverride === null ? 'auto' : animation.loopOverride ? 'on' : 'off'}
                onChange={(e) => {
                  const v = e.target.value;
                  setLoopOverride(v === 'auto' ? null : v === 'on');
                }}
              >
                <option value="auto">{t('loopAuto')} ({(currentSeq.flags & 0x0001) ? t('yes') : t('no')})</option>
                <option value="on">{t('loopOn')}</option>
                <option value="off">{t('loopOff')}</option>
              </select>
            </div>
          </div>

          {/* Sequence Info */}
          <div>
            <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
              {t('sequenceInfo')}
            </label>
            <div className="bg-hlam-bg rounded p-2 text-xs font-mono space-y-0.5">
              <div>{t('fps')}: {currentSeq.fps.toFixed(1)}</div>
              <div>{t('frames')}: {currentSeq.numFrames}</div>
              <div>{t('flags')}: 0x{currentSeq.flags.toString(16).padStart(4, '0')}</div>
              <div>{t('activity')}: {currentSeq.activity} ({t('weight')}: {currentSeq.actWeight})</div>
              <div>{t('blends')}: {currentSeq.blends.length}</div>
              <div>{t('looping')}: {(currentSeq.flags & 0x0001) ? t('yes') : t('no')}</div>
            </div>
          </div>

          {/* Blenders */}
          {currentSeq.blends.length > 1 && (
            <div>
              <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
                {t('blendControls')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-hlam-text-dim w-14">Blend 1</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={animation.blenders[0]}
                  onChange={(e) => setBlender(0, Number(e.target.value))}
                  className="flex-1 accent-hlam-accent h-1.5"
                />
                <span className="text-xs font-mono w-8 text-right">{animation.blenders[0]}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-hlam-text-dim w-14">Blend 2</span>
                <input
                  type="range"
                  min={0}
                  max={255}
                  value={animation.blenders[1]}
                  onChange={(e) => setBlender(1, Number(e.target.value))}
                  className="flex-1 accent-hlam-accent h-1.5"
                />
                <span className="text-xs font-mono w-8 text-right">{animation.blenders[1]}</span>
              </div>
            </div>
          )}

          {/* Events */}
          {currentSeq.events.length > 0 && (
            <div>
              <label className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold mb-1 block">
                {t('events')} ({currentSeq.events.length})
              </label>
              <div className="max-h-32 overflow-y-auto bg-hlam-bg rounded">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="text-hlam-text-dim border-b border-hlam-border">
                      <th className="px-1 py-0.5 text-left">{t('evtFrame')}</th>
                      <th className="px-1 py-0.5 text-left">{t('evtEvent')}</th>
                      <th className="px-1 py-0.5 text-left">{t('evtOptions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSeq.events.map((ev, i) => (
                      <tr key={i} className="border-b border-hlam-border/50 hover:bg-hlam-surface">
                        <td className="px-1 py-0.5">{ev.frame}</td>
                        <td className="px-1 py-0.5">{ev.eventId}</td>
                        <td className="px-1 py-0.5 truncate max-w-[120px]">{ev.options}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full text-hlam-text-muted text-sm p-4">
      {message}
    </div>
  );
}
