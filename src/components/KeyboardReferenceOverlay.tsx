import { useEffect } from "react";

export function KeyboardReferenceOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div className="overlay-backdrop" onClick={onClose}>
      <div className="keyboard-reference-overlay" onClick={(e) => e.stopPropagation()}>
        <div className="overlay-header">
          <h3>Keyboard Token Reference</h3>
          <button className="icon-btn" onClick={onClose} title="Close (Esc)" aria-label="Close overlay">
            ✕
          </button>
        </div>
        <div className="overlay-content">
          <section>
            <h4>Standard Keys</h4>
            <ul className="token-list">
              <li><code>Enter</code> — Return/Enter key</li>
              <li><code>Escape</code> — Escape key</li>
              <li><code>Tab</code> — Tab key</li>
              <li><code>Space</code> — Space bar</li>
              <li><code>Backspace</code> — Backspace/Delete left</li>
              <li><code>Delete</code> — Delete key</li>
              <li><code>Home</code> — Home key</li>
              <li><code>End</code> — End key</li>
              <li><code>PageUp</code> — Page Up</li>
              <li><code>PageDown</code> — Page Down</li>
            </ul>
          </section>
          <section>
            <h4>Arrow Keys</h4>
            <ul className="token-list">
              <li><code>ArrowUp</code> — Up arrow</li>
              <li><code>ArrowDown</code> — Down arrow</li>
              <li><code>ArrowLeft</code> — Left arrow</li>
              <li><code>ArrowRight</code> — Right arrow</li>
            </ul>
          </section>
          <section>
            <h4>Modifiers</h4>
            <ul className="token-list">
              <li><code>Shift</code> — Shift modifier</li>
              <li><code>Control</code> or <code>Ctrl</code> — Control modifier</li>
              <li><code>Alt</code> — Alt modifier</li>
              <li><code>Meta</code> — Windows/Command key</li>
            </ul>
          </section>
          <section>
            <h4>Inline Token Syntax (for Type action)</h4>
            <p>Wrap special keys in curly braces with <code>Key:</code> prefix:</p>
            <ul className="example-list">
              <li><code>{"{Key:Enter}"}</code> — Press Enter</li>
              <li><code>{"{Key:Ctrl+K}"}</code> — Press Ctrl+K</li>
              <li><code>{"{Key:Alt+Tab}"}</code> — Press Alt+Tab</li>
              <li><code>{"{Key:Shift+Home}"}</code> — Press Shift+Home</li>
            </ul>
            <p>Example: <code>{"Hello world{Key:Enter}continue"}</code></p>
          </section>
          <section>
            <h4>Combining Modifiers</h4>
            <p>Use <code>+</code> to combine multiple modifiers:</p>
            <ul className="example-list">
              <li><code>Ctrl+Shift+K</code> — Control + Shift + K</li>
              <li><code>Alt+Shift+ArrowLeft</code> — Alt + Shift + Left Arrow</li>
              <li><code>Meta+Space</code> — Windows/Cmd + Space</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
