// ============================================================================
// Messages Panel
// Log/output messages panel
// ============================================================================

import { useRef, useEffect } from 'react';
import { useAppStore } from '../../store';
import { useT } from '../../i18n';

export function MessagesPanel() {
  const showMessages = useAppStore((s) => s.showMessages);
  const messageLog = useAppStore((s) => s.messageLog);
  const toggleMessages = useAppStore((s) => s.toggleMessages);
  const scrollRef = useRef<HTMLDivElement>(null);
  const t = useT();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageLog.length]);

  if (!showMessages) return null;

  return (
    <div className="h-32 bg-hlam-surface border-t border-hlam-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-hlam-border bg-hlam-panel">
        <span className="text-xs text-hlam-text-dim uppercase tracking-wider font-semibold">
          {t('messagesTitle')} ({messageLog.length})
        </span>
        <button
          className="text-xs text-hlam-text-muted hover:text-hlam-text"
          onClick={toggleMessages}
        >
          ✕
        </button>
      </div>

      {/* Log content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-1 font-mono text-xs">
        {messageLog.length === 0 ? (
          <div className="text-hlam-text-muted py-2">{t('noMessages')}</div>
        ) : (
          messageLog.map((msg, i) => (
            <div
              key={i}
              className={`py-0.5 ${msg.includes('Error') ? 'text-hlam-error' : 'text-hlam-text-dim'}`}
            >
              {msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
