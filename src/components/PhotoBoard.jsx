import { useState } from "react";
import styles from "./PhotoBoard.module.css";

const AVERY_PHOTOS = [
  "/IMG_20260310_104622.jpg",
  "/IMG_20260304_201547.jpg",
  "/IMG_20260304_201526.jpg",
  "/20250622_131905.jpg",
  "/20240629_223427.jpg",
  "/20240629_223228.jpg",
  "/IMG_20250228_210321.jpg",
];

const CAPTIONS = [
  "The Lady Herself",
  "Fear Her Wrath",
  "She Sees All",
  "✦ Avery ✦",
  "The Registrar",
  "Cross Her Not",
  "She Never Forgets",
];

const PIN_COLORS = ["#c00", "#1a6b1a", "#1a3a8b", "#c8a04a", "#8b0000"];
const ROTATIONS = [-7, 4, -3, 6, -5, 3, -8];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function PhotoBoard() {
  const [photos] = useState(() => shuffle(AVERY_PHOTOS));

  return (
    <div className={styles.photoBoard}>
      {/* Corner nails */}
      <div className={`${styles.nail} ${styles.nailTL}`} />
      <div className={`${styles.nail} ${styles.nailTR}`} />
      <div className={`${styles.nail} ${styles.nailBL}`} />
      <div className={`${styles.nail} ${styles.nailBR}`} />

      <div className={styles.corkSurface}>
        <div className={styles.boardLabel}>☠ The Lady ☠</div>
        <div className={styles.photoList}>
          {photos.map((src, i) => (
            <div
              key={src}
              className={styles.polaroid}
              style={{
                "--rot": `${ROTATIONS[i % ROTATIONS.length]}deg`,
                "--pin-color": PIN_COLORS[i % PIN_COLORS.length],
              }}
            >
              <div className={styles.pin} />
              <img
                src={src}
                alt="Avery Thornton"
                className={styles.photo}
                loading="lazy"
              />
              <div className={styles.caption}>{CAPTIONS[i % CAPTIONS.length]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
