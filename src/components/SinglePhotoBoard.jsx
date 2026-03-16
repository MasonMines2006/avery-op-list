import { useState } from "react";
import styles from "./SinglePhotoBoard.module.css";

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

export default function SinglePhotoBoard() {
  const [photoIndex] = useState(() =>
    Math.floor(Math.random() * AVERY_PHOTOS.length),
  );

  const src = AVERY_PHOTOS[photoIndex];
  const caption = CAPTIONS[photoIndex % CAPTIONS.length];
  const pinColor = PIN_COLORS[photoIndex % PIN_COLORS.length];
  const rotation = ROTATIONS[photoIndex % ROTATIONS.length];

  return (
    <div className={styles.photoBoard}>
      {/* Wooden frame with nails */}
      <div className={`${styles.nail} ${styles.nailTL}`} />
      <div className={`${styles.nail} ${styles.nailTR}`} />
      <div className={`${styles.nail} ${styles.nailBL}`} />
      <div className={`${styles.nail} ${styles.nailBR}`} />

      {/* Cork surface */}
      <div className={styles.corkSurface}>
        {/* Single polaroid */}
        <div
          className={styles.polaroid}
          style={{ "--rot": `${rotation}deg`, "--pin-color": pinColor }}
        >
          <div className={styles.pin} />
          <img
            src={src}
            alt="Avery Thornton"
            className={styles.photo}
            loading="lazy"
          />
          <div className={styles.caption}>{caption}</div>
        </div>
      </div>
    </div>
  );
}
