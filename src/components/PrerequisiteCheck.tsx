import { useEffect, useState } from "react";
import { checkInputPrerequisites, PrerequisiteCheck as CheckResult } from "../tauriBridge";
import { isDesktopEnvironment } from "../utils/runtime";

interface Props {
  onClose?: () => void;
}

export function PrerequisiteCheck({ onClose }: Props) {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isDesktopEnvironment()) {
      setLoading(false);
      return;
    }
    checkInputPrerequisites().then(result => {
      setCheck(result);
      setLoading(false);
    }).catch(err => {
      console.error("Failed to check prerequisites:", err);
      setLoading(false);
    });
  }, []);

  if (!isDesktopEnvironment()) {
    return null; // Not applicable in web mode
  }

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999
      }}>
        <div style={{
          background: "var(--color-bg)",
          padding: "2rem",
          borderRadius: "8px",
          maxWidth: "600px",
          border: "2px solid var(--color-border)"
        }}>
          <h2 style={{ marginTop: 0 }}>Checking prerequisites...</h2>
        </div>
      </div>
    );
  }

  if (!check) {
    return null;
  }

  const allGood = check.x11_session && check.x11_connection && check.xinput_available &&
                  check.xtest_available && check.backend_not_fake && check.feature_enabled;

  if (allGood && onClose) {
    // Auto-close if all checks pass
    setTimeout(() => onClose(), 100);
    return null;
  }

  if (allGood) {
    return null; // Don't show anything if everything is OK
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      padding: "2rem"
    }}>
      <div style={{
        background: "var(--color-bg)",
        padding: "2rem",
        borderRadius: "8px",
        maxWidth: "800px",
        maxHeight: "80vh",
        overflow: "auto",
        border: "3px solid #dc3545"
      }}>
        <h2 style={{ marginTop: 0, color: "#dc3545" }}>⚠️ Input Recording Prerequisites Not Met</h2>
        
        <p style={{ fontSize: "1.1em", marginBottom: "1.5rem" }}>
          Your system does not meet the requirements for input recording. Please fix the issues below:
        </p>

        <div style={{ marginBottom: "2rem" }}>
          <h3>System Status:</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <CheckRow label="X11 Session" passed={check.x11_session} detail={`Session type: ${check.session_type}`} />
              <CheckRow label="X11 Connection" passed={check.x11_connection} detail={`DISPLAY: ${check.display_env}`} />
              <CheckRow label="XInput Extension" passed={check.xinput_available} />
              <CheckRow label="XTest Extension" passed={check.xtest_available} />
              <CheckRow label="Real Backend" passed={check.backend_not_fake} detail="LOOPAUTOMA_BACKEND not set to 'fake'" />
              <CheckRow label="Feature Enabled" passed={check.feature_enabled} detail="os-linux-input compiled" />
            </tbody>
          </table>
        </div>

        {check.error_details.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h3 style={{ color: "#dc3545" }}>Errors:</h3>
            <ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
              {check.error_details.map((err, i) => (
                <li key={i} style={{ marginBottom: "0.5rem", color: "#dc3545" }}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ background: "#f8f9fa", padding: "1rem", borderRadius: "4px", marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>How to Fix:</h3>
          
          {!check.x11_session && (
            <div style={{ marginBottom: "1rem" }}>
              <h4>Switch to X11 Session:</h4>
              <ol>
                <li>Log out of your current session</li>
                <li>At the login screen, click the gear icon (⚙️)</li>
                <li>Select "Ubuntu on Xorg" or "GNOME on Xorg"</li>
                <li>Log back in</li>
              </ol>
            </div>
          )}

          {!check.x11_connection && (
            <div style={{ marginBottom: "1rem" }}>
              <h4>Fix X11 Connection:</h4>
              <p>Make sure the DISPLAY environment variable is set:</p>
              <code style={{ 
                display: "block", 
                background: "#000", 
                color: "#0f0", 
                padding: "0.5rem",
                borderRadius: "4px",
                fontFamily: "monospace"
              }}>
                echo $DISPLAY
              </code>
              <p style={{ marginTop: "0.5rem" }}>Should show something like ":0" or ":1"</p>
            </div>
          )}

          {(!check.xinput_available || !check.xtest_available) && (
            <div style={{ marginBottom: "1rem" }}>
              <h4>Install X11 Development Libraries:</h4>
              <code style={{ 
                display: "block", 
                background: "#000", 
                color: "#0f0", 
                padding: "0.5rem",
                borderRadius: "4px",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap"
              }}>
                sudo apt update{"\n"}
                sudo apt install -y libx11-dev libxext-dev libxi-dev libxtst-dev libxkbcommon-dev libxkbcommon-x11-dev
              </code>
              <p style={{ marginTop: "0.5rem" }}>Then rebuild the app: <code>cargo build</code></p>
            </div>
          )}

          {!check.backend_not_fake && (
            <div style={{ marginBottom: "1rem" }}>
              <h4>Unset Fake Backend:</h4>
              <code style={{ 
                display: "block", 
                background: "#000", 
                color: "#0f0", 
                padding: "0.5rem",
                borderRadius: "4px",
                fontFamily: "monospace"
              }}>
                unset LOOPAUTOMA_BACKEND
              </code>
              <p style={{ marginTop: "0.5rem" }}>Then restart the app</p>
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.75rem 1.5rem",
              fontSize: "1em",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            Recheck Prerequisites
          </button>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                padding: "0.75rem 1.5rem",
                fontSize: "1em",
                background: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              Continue Anyway
            </button>
          )}
        </div>

        <p style={{ 
          marginTop: "1.5rem", 
          marginBottom: 0, 
          fontSize: "0.9em", 
          color: "#6c757d" 
        }}>
          For more help, see <code>doc/developer.md</code> in the repository.
        </p>
      </div>
    </div>
  );
}

function CheckRow({ label, passed, detail }: { label: string; passed: boolean; detail?: string }) {
  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
      <td style={{ padding: "0.5rem", fontWeight: "bold" }}>{label}</td>
      <td style={{ padding: "0.5rem", textAlign: "center" }}>
        {passed ? (
          <span style={{ color: "#28a745", fontSize: "1.5em" }}>✓</span>
        ) : (
          <span style={{ color: "#dc3545", fontSize: "1.5em" }}>✗</span>
        )}
      </td>
      <td style={{ padding: "0.5rem", fontSize: "0.9em", color: "#6c757d" }}>
        {detail || ""}
      </td>
    </tr>
  );
}
