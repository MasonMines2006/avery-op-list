import { useState } from "react";
import { apiUrl } from "../api.js";
import styles from "./LoginPage.module.css";

export default function LoginPage({ onLogin, onClose }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        setError("The password is incorrect. Speak the right words.");
        return;
      }
      const { token } = await res.json();
      onLogin(token);
    } catch {
      setError("The server doth not respond. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={onClose ? styles.overlay : styles.page}
      onClick={
        onClose
          ? (e) => {
              if (e.target === e.currentTarget) onClose();
            }
          : undefined
      }
    >
      <div className={styles.gate}>
        {onClose && (
          <button className={styles.closeBtn} onClick={onClose} title="Close">
            ✕
          </button>
        )}
        <div className={styles.torchLeft}>🔥</div>
        <div className={styles.torchRight}>🔥</div>

        <div className={styles.crest}>⚜</div>
        <h1 className={styles.title}>
          Speak, Friend,
          <br />
          and Enter
        </h1>
        <p className={styles.subtitle}>
          This register is sealed by enchantment.
          <br />
          Only those who know the secret word may pass.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputWrap}>
            <span className={styles.keyIcon}>🗝</span>
            <input
              type="password"
              className={styles.input}
              placeholder="The secret word..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "Consulting the oracle..." : "Present Thyself"}
          </button>
        </form>

        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />
      </div>
    </div>
  );
}
