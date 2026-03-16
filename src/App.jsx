import { useState, useEffect, useCallback } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import EditModal from "./components/EditModal.jsx";
import SinglePhotoBoard from "./components/SinglePhotoBoard.jsx";
import PhotoBoard from "./components/PhotoBoard.jsx";
import { apiUrl } from "./api.js";
import styles from "./App.module.css";

// ── Auth helpers ───────────────────────────────────────────
function getToken() {
  return localStorage.getItem("op_token");
}
function saveToken(t) {
  localStorage.setItem("op_token", t);
}
function clearToken() {
  localStorage.removeItem("op_token");
}
function authHeaders() {
  return { "Content-Type": "application/json", "x-auth-token": getToken() };
}

// ── Backgrounds ────────────────────────────────────────────
const BACKGROUNDS = ["/Medieval Background Pixel Art (1).png"];

// ── Rank label ─────────────────────────────────────────────
const rankLabel = (n) => {
  const labels = [
    "",
    "Most Wanted",
    "Grievous Offender",
    "Villain of Note",
    "Offender the IV",
    "Offender the V",
    "Offender the VI",
    "Offender the VII",
    "Offender the VIII",
    "Offender the IX",
    "Offender the X",
  ];
  return labels[n] ?? `Offender the ${n}`;
};

// ── Notice Card ─────────────────────────────────────────────
function NoticeCard({
  enemy,
  isEditing,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  return (
    <article
      className={`${styles.card} ${styles[`rank${Math.min(enemy.rank, 5)}`]}`}
    >
      <div className={styles.cardInner}>
        {isEditing && (
          <div className={styles.editControls}>
            <button
              className={styles.ctrlBtn}
              onClick={onMoveUp}
              disabled={isFirst}
              title="Move up"
            >
              ▲
            </button>
            <button
              className={styles.ctrlBtn}
              onClick={onMoveDown}
              disabled={isLast}
              title="Move down"
            >
              ▼
            </button>
            <button
              className={styles.ctrlBtnEdit}
              onClick={onEdit}
              title="Edit"
            >
              ✎
            </button>
            <button
              className={styles.ctrlBtnDel}
              onClick={onDelete}
              title="Remove"
            >
              ✕
            </button>
          </div>
        )}

        <div className={styles.rankBadge}>
          <span className={styles.rankNum}>#{enemy.rank}</span>
          <span className={styles.rankLabel}>{rankLabel(enemy.rank)}</span>
        </div>
        <div className={styles.dividerH} />
        <div className={styles.sealRow}>
          <span className={styles.seal}>{enemy.seal}</span>
          <h2 className={styles.name}>{enemy.name}</h2>
          <span className={styles.seal}>{enemy.seal}</span>
        </div>
        <div className={styles.offenseTag}>{enemy.offense}</div>
        <div className={styles.dividerH} />
        <p className={styles.description}>{enemy.description}</p>
        <div className={styles.cornerTL} />
        <div className={styles.cornerTR} />
        <div className={styles.cornerBL} />
        <div className={styles.cornerBR} />
      </div>
    </article>
  );
}

// ── App ─────────────────────────────────────────────────────
export default function App() {
  const [token, setToken] = useState(getToken);
  const [enemies, setEnemies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setEditing] = useState(false);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [scrollOpen, setScrollOpen] = useState(false);
  const [notifyStatus, setNotifyStatus] = useState(null); // null | 'sending' | 'ok' | string(error)
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [notifyConfig, setNotifyConfig] = useState({
    email: false,
    webhook: false,
    loaded: false,
  });

  // Random background, falls back to bg-medieval.png on load error
  const [bgImage] = useState(
    () => BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
  );

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      document.body.style.backgroundImage = `linear-gradient(rgba(8,3,0,0.48),rgba(8,3,0,0.48)),url('${bgImage}')`;
    };
    img.onerror = () => {
      document.body.style.backgroundImage = `linear-gradient(rgba(8,3,0,0.48),rgba(8,3,0,0.48)),url('/bg-medieval.png')`;
    };
    img.src = bgImage;
    return () => {
      document.body.style.backgroundImage = "";
    };
  }, [bgImage]);

  const fetchEnemies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/enemies"));
      const data = await res.json();
      setEnemies(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnemies();
  }, [fetchEnemies]);

  useEffect(() => {
    let active = true;

    async function fetchNotifyStatus() {
      try {
        const res = await fetch(apiUrl("/api/notify/status"));
        const data = await res.json();
        if (active) {
          setNotifyConfig({
            email: !!data.email,
            webhook: !!data.webhook,
            loaded: true,
          });
        }
      } catch {
        if (active) {
          setNotifyConfig({ email: false, webhook: false, loaded: true });
        }
      }
    }

    fetchNotifyStatus();

    return () => {
      active = false;
    };
  }, []);

  async function persist(updated) {
    setSaving(true);
    try {
      const res = await fetch(apiUrl("/api/enemies"), {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ enemies: updated }),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      setSaveMsg("Sealed & saved.");
      setTimeout(() => setSaveMsg(""), 2500);
    } finally {
      setSaving(false);
    }
  }

  function applyAndPersist(updated) {
    const renumbered = updated.map((e, i) => ({ ...e, rank: i + 1 }));
    setEnemies(renumbered);
    persist(renumbered);
  }

  function handleLogin(t) {
    saveToken(t);
    setToken(t);
    setShowLogin(false);
  }

  async function handleLogout() {
    try {
      await fetch(apiUrl("/api/logout"), {
        method: "POST",
        headers: authHeaders(),
      });
    } catch {}
    clearToken();
    setToken(null);
    setEditing(false);
  }

  function handleModalSave(updated) {
    const next = updated.id
      ? enemies.map((e) => (e.id === updated.id ? updated : e))
      : [...enemies, { ...updated, id: crypto.randomUUID() }];
    applyAndPersist(next);
    setModal(null);
  }

  function handleDelete(id) {
    applyAndPersist(enemies.filter((e) => e.id !== id));
  }

  function handleMove(idx, dir) {
    const next = [...enemies];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    applyAndPersist(next);
  }

  async function handleSubscribe(e) {
    e.preventDefault();
    setSubscribeStatus("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubscribeStatus(`⚠ ${data.error || "Failed to subscribe"}`);
      } else if (data.already) {
        setSubscribeStatus("✦ Thou art already subscribed!");
        setTimeout(() => { setShowSubscribe(false); setSubscribeStatus(null); }, 2000);
      } else {
        setSubscribeStatus("✦ Thou art now subscribed to royal proclamations!");
        setSubscribeEmail("");
        setTimeout(() => { setShowSubscribe(false); setSubscribeStatus(null); }, 2500);
      }
    } catch {
      setSubscribeStatus("⚠ Could not reach the server");
    }
  }

  async function handleTestNotify() {
    setNotifyStatus("sending");
    try {
      const res = await fetch(apiUrl("/api/notify/test"), {
        method: "POST",
        headers: authHeaders(),
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setNotifyStatus(`error: ${data.error}`);
      } else {
        const parts = Object.entries(data.results || {})
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
        setNotifyStatus(parts ? `sent — ${parts}` : "sent");
      }
    } catch (e) {
      setNotifyStatus(`error: ${e.message}`);
    }
    setTimeout(() => setNotifyStatus(null), 4000);
  }

  function openBoard() {
    setBoardOpen(true);
  }

  function closeBoard() {
    setBoardOpen(false);
    setScrollOpen(false);
  }

  const notificationsAvailable = notifyConfig.email || notifyConfig.webhook;
  const notifyButtonLabel =
    notifyStatus === "sending"
      ? "📨 Dispatching..."
      : notifyStatus
        ? `🔔 ${notifyStatus}`
        : notificationsAvailable
          ? "🔔 Test Notification"
          : "🔕 Alerts Unavailable";
  const notifyButtonTitle = notificationsAvailable
    ? "Send a test notification"
    : notifyConfig.loaded
      ? "Configure NOTIFY_EMAIL or NOTIFY_WEBHOOK in .env"
      : "Checking notification channels";

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Top auth bar */}
      <div className={styles.topBar}>
        {token ? (
          <>
            <button
              className={`${styles.topBtn} ${isEditing ? styles.topBtnActive : ""}`}
              onClick={() => setEditing((v) => !v)}
            >
              {isEditing ? "🔒 Lock the Board" : "✎ Edit the Register"}
            </button>
            <button className={styles.topBtnLogout} onClick={handleLogout}>
              Depart
            </button>
          </>
        ) : (
          <button className={styles.topBtn} onClick={() => setShowLogin(true)}>
            🗝 Enter
          </button>
        )}
      </div>

      {/* ── Herald banner ──────────────────────────────────────── */}
      <div className={styles.heraldBannerWrap}>
        <div className={styles.heraldBannerLeft} />
        <div className={styles.heraldBannerCenter}>
          ⚔ Avery Thornton&apos;s Royal Op List ⚔
        </div>
        <div className={styles.heraldBannerRight} />
      </div>

      {/* ── Scene: the pixel art landscape with the small board ── */}
      <div className={styles.scene}>
        {/* Atmospheric death decorations */}
        <span className={styles.sceneSkull}>💀</span>
        <span className={styles.sceneSkull}>☠</span>
        <span className={styles.sceneSkull}>💀</span>
        <span className={styles.sceneSkull}>⚔</span>

        {/* Single photo on the left */}
        <SinglePhotoBoard />

        {/* Subscribe button */}
        <button
          className={styles.subscribeBtn}
          onClick={() => setShowSubscribe(true)}
          title="Subscribe to updates"
        >
          📜 Subscribe to the Register
        </button>

        <div
          className={styles.boardIcon}
          onClick={openBoard}
          title="Open the Register"
          role="button"
        >
          <div className={styles.boardIconFrame}>
            <div className={styles.boardIconCork}>
              <div className={styles.noticePaperWrap}>
                <div className={styles.noticePaperPin} />
                <div className={styles.noticePaper}>
                  <span className={styles.noticeSwords}>⚔</span>
                  <span className={styles.noticeLabel}>NOTICE</span>
                  <span className={styles.noticeLabel}>BOARD</span>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.boardPost} />
          <div className={styles.boardClickHint}>click to open</div>
        </div>
      </div>

      {/* ── Full board modal ──────────────────────────────────── */}
      {boardOpen && (
        <div
          className={styles.boardModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeBoard();
          }}
        >
          <div className={styles.bulletinBoard}>
            <button
              className={styles.boardCloseBtn}
              onClick={closeBoard}
              title="Close"
            >
              ✕
            </button>

            {/* Corner nails */}
            <div className={`${styles.nail} ${styles.nailTL}`} />
            <div className={`${styles.nail} ${styles.nailTR}`} />
            <div className={`${styles.nail} ${styles.nailBL}`} />
            <div className={`${styles.nail} ${styles.nailBR}`} />

            <div className={styles.corkSurface}>
              {/* Photo bulletin board sidebar */}
              <div className={styles.photoSidebar}>
                <PhotoBoard />
              </div>

              <div
                className={`${styles.scroll} ${scrollOpen ? styles.scrollOpen : ""}`}
              >
                <div className={styles.scrollRoller} />

                <div className={styles.scrollContent}>
                  {/* Always-visible header */}
                  <div
                    className={styles.scrollHeader}
                    onClick={() => setScrollOpen((v) => !v)}
                    role="button"
                    aria-expanded={scrollOpen}
                  >
                    <div className={styles.crossedSwords}>⚔ ✦ ⚔</div>
                    <p className={styles.herald}>By Royal Decree of</p>
                    <div className={styles.titleBannerWrap}>
                      <div className={styles.titleBannerLeft} />
                      <h1 className={styles.titleBanner}>Avery Thornton</h1>
                      <div className={styles.titleBannerRight} />
                    </div>
                    <p className={styles.subtitle}>
                      <em>
                        Official Register of Enemies, Miscreants &amp; Persons
                        of Ill Repute
                      </em>
                    </p>
                    <p className={styles.herald}>
                      Listed in Order of Severity of Offence
                    </p>
                    <div className={styles.crossedSwords}>✦ ✦ ✦</div>
                    <div className={styles.scrollToggle}>
                      {scrollOpen
                        ? "▲ Roll Up the Scroll"
                        : "▼ Unroll the Scroll"}
                    </div>
                  </div>

                  {/* Expandable enemy list */}
                  <div className={styles.scrollBody}>
                    <div className={styles.boardHeader}>
                      <span>— ☠ NOTICE BOARD ☠ —</span>
                    </div>

                    {isEditing && (
                      <div className={styles.editBanner}>
                        <span>
                          {saving
                            ? "⏳ Sealing the record..."
                            : saveMsg ||
                              "✎ Edit mode — move, amend, or strike entries from the register"}
                        </span>
                        <div className={styles.editBannerActions}>
                          <button
                            className={styles.addBtn}
                            onClick={() =>
                              setModal({
                                enemy: {
                                  id: "",
                                  name: "",
                                  offense: "",
                                  description: "",
                                  seal: "⚔",
                                },
                              })
                            }
                          >
                            + Add to the Register
                          </button>
                          <button
                            className={styles.notifyBtn}
                            onClick={handleTestNotify}
                            disabled={
                              notifyStatus === "sending" ||
                              !notificationsAvailable
                            }
                            title={notifyButtonTitle}
                          >
                            {notifyButtonLabel}
                          </button>
                        </div>
                      </div>
                    )}

                    {loading ? (
                      <p className={styles.loading}>
                        Consulting the scrolls...
                      </p>
                    ) : (
                      <div className={styles.grid}>
                        {enemies.map((e, idx) => (
                          <NoticeCard
                            key={e.id}
                            enemy={e}
                            isEditing={isEditing}
                            isFirst={idx === 0}
                            isLast={idx === enemies.length - 1}
                            onEdit={() => setModal({ enemy: e })}
                            onDelete={() => handleDelete(e.id)}
                            onMoveUp={() => handleMove(idx, -1)}
                            onMoveDown={() => handleMove(idx, 1)}
                          />
                        ))}
                      </div>
                    )}

                    <footer className={styles.footer}>
                      <p>
                        ☠ &nbsp; Cross Lady Avery and find thyself upon this
                        list &nbsp; ☠
                      </p>
                      <p className={styles.footerSub}>
                        Updated as offences are committed &mdash; Anno Domini,
                        Ongoing
                      </p>
                      <p className={styles.footerSub}>
                        None who have wronged her shall escape the register.
                        None.
                      </p>
                    </footer>
                  </div>
                </div>

                <div className={styles.scrollRollerBottom} />
              </div>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <EditModal
          enemy={modal.enemy}
          onSave={handleModalSave}
          onClose={() => setModal(null)}
        />
      )}

      {showLogin && (
        <LoginPage onLogin={handleLogin} onClose={() => setShowLogin(false)} />
      )}

      {/* ── Subscribe modal ─────────────────────────────────── */}
      {showSubscribe && (
        <div
          className={styles.boardModal}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSubscribe(false);
              setSubscribeStatus(null);
            }
          }}
        >
          <div className={styles.subscribeCard}>
            <button
              className={styles.boardCloseBtn}
              onClick={() => { setShowSubscribe(false); setSubscribeStatus(null); }}
              title="Close"
            >
              ✕
            </button>
            <h2 className={styles.subscribeTitle}>Subscribe to Royal Proclamations</h2>
            <p className={styles.subscribeDesc}>
              Receive word when the register is updated.
            </p>
            <form onSubmit={handleSubscribe} className={styles.subscribeForm}>
              <input
                type="email"
                value={subscribeEmail}
                onChange={(e) => setSubscribeEmail(e.target.value)}
                placeholder="thy@email.domain"
                className={styles.subscribeInput}
                required
              />
              <button
                type="submit"
                className={styles.subscribeSubmit}
                disabled={subscribeStatus === "sending"}
              >
                {subscribeStatus === "sending" ? "📜 Registering..." : "📜 Pledge Thy Allegiance"}
              </button>
            </form>
            {subscribeStatus && subscribeStatus !== "sending" && (
              <p className={styles.subscribeMsg}>{subscribeStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
