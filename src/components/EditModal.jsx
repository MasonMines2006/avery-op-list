import { useState } from "react";
import styles from "./EditModal.module.css";

const SEAL_OPTIONS = [
  "☠",
  "⚔",
  "🐍",
  "🤡",
  "👁",
  "🗝",
  "🕯",
  "💀",
  "🔥",
  "⚜",
  "🩸",
  "🪄",
];

export default function EditModal({ enemy, onSave, onClose }) {
  const [form, setForm] = useState({
    name: enemy?.name ?? "",
    offense: enemy?.offense ?? "",
    description: enemy?.description ?? "",
    seal: enemy?.seal ?? "⚔",
  });

  function set(field, val) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({ ...enemy, ...form });
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.headerTitle}>
            {enemy?.id ? "Amend the Record" : "Add to the Register"}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.dividerH} />

        <div className={styles.body}>
          <label className={styles.label}>Name of the Accused</label>
          <input
            className={styles.input}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Full name..."
          />

          <label className={styles.label}>Nature of Offence</label>
          <input
            className={styles.input}
            value={form.offense}
            onChange={(e) => set("offense", e.target.value)}
            placeholder="e.g. Treachery Most Foul"
          />

          <label className={styles.label}>Full Account of Wrongdoing</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the offence in full..."
            rows={5}
          />

          <label className={styles.label}>Seal / Mark</label>
          <div className={styles.sealGrid}>
            {SEAL_OPTIONS.map((s) => (
              <button
                key={s}
                className={`${styles.sealBtn} ${form.seal === s ? styles.sealSelected : ""}`}
                onClick={() => set("seal", s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.dividerH} />

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Discard
          </button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            Seal &amp; Save
          </button>
        </div>

        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />
      </div>
    </div>
  );
}
