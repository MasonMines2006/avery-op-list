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

// Pin colours — cycling
const PIN_COLORS = ["#c00", "#1a6b1a", "#1a3a8b", "#c8a04a", "#8b0000"];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ROTATIONS = [-7, 4, -3, 6, -5, 3, -8];

export default function PhotoBoard() {
  const [photos] = useState(() => shuffle(AVERY_PHOTOS));

  return (
    <div className={styles.photoStrip}>
      <div className={styles.stripLabel}>☠ The Lady of the Register ☠</div>
      <div className={styles.photos}>
        {photos.map((src, i) => (
          <div
            key={src}
            className={styles.polaroid}
            style={{ "--rot": `${ROTATIONS[i % ROTATIONS.length]}deg` }}
          >
            <div
              className={styles.pin}
              style={{ "--pin-color": PIN_COLORS[i % PIN_COLORS.length] }}
            />
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
  );
}
