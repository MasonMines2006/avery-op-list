import { useState, useEffect, useCallback } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import EditModal from './components/EditModal.jsx'
import styles from './App.module.css'

// ── Auth helpers ───────────────────────────────────────────
function getToken() { return localStorage.getItem('op_token') }
function saveToken(t) { localStorage.setItem('op_token', t) }
function clearToken() { localStorage.removeItem('op_token') }

function authHeaders() {
  return { 'Content-Type': 'application/json', 'x-auth-token': getToken() }
}

// ── Backgrounds ────────────────────────────────────────────
const BACKGROUNDS = [
  '/bg-medieval.png',
  '/bg-forest.png',
  '/bg-village.png',
]

// ── Rank label ─────────────────────────────────────────────
const rankLabel = (n) => {
  const labels = ['', 'Most Wanted', 'Grievous Offender', 'Villain of Note',
    'Offender the IV', 'Offender the V', 'Offender the VI', 'Offender the VII',
    'Offender the VIII', 'Offender the IX', 'Offender the X']
  return labels[n] ?? `Offender the ${n}`
}

// ── Notice Card ─────────────────────────────────────────────
function NoticeCard({ enemy, isEditing, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  return (
    <article className={`${styles.card} ${styles[`rank${Math.min(enemy.rank, 5)}`]}`}>
      <div className={styles.cardInner}>
        {isEditing && (
          <div className={styles.editControls}>
            <button className={styles.ctrlBtn} onClick={onMoveUp}  disabled={isFirst} title="Move up">▲</button>
            <button className={styles.ctrlBtn} onClick={onMoveDown} disabled={isLast}  title="Move down">▼</button>
            <button className={styles.ctrlBtnEdit} onClick={onEdit}   title="Edit">✎</button>
            <button className={styles.ctrlBtnDel}  onClick={onDelete} title="Remove">✕</button>
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
  )
}

// ── App ─────────────────────────────────────────────────────
export default function App() {
  const [token, setToken]       = useState(getToken)
  const [enemies, setEnemies]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [isEditing, setEditing] = useState(false)
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saveMsg, setSaveMsg]   = useState('')
  const [showLogin, setShowLogin] = useState(false)
  const [scrollOpen, setScrollOpen] = useState(false)

  // Pick a random background on mount, skip any that fail to load
  const [bgImage] = useState(() => {
    const all = BACKGROUNDS
    return all[Math.floor(Math.random() * all.length)]
  })

  useEffect(() => {
    // Try the chosen image; fall back to bg-medieval.png if it 404s
    const img = new Image()
    img.onload = () => {
      document.body.style.backgroundImage =
        `linear-gradient(rgba(8,3,0,0.52),rgba(8,3,0,0.52)),url('${bgImage}')`
    }
    img.onerror = () => {
      document.body.style.backgroundImage =
        `linear-gradient(rgba(8,3,0,0.52),rgba(8,3,0,0.52)),url('/bg-medieval.png')`
    }
    img.src = bgImage
    return () => { document.body.style.backgroundImage = '' }
  }, [bgImage])

  // Fetch enemies from API
  const fetchEnemies = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/enemies')
      const data = await res.json()
      setEnemies(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchEnemies() }, [fetchEnemies])

  // Persist to server
  async function persist(updated) {
    setSaving(true)
    try {
      const res = await fetch('/api/enemies', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ enemies: updated }),
      })
      if (res.status === 401) { handleLogout(); return }
      setSaveMsg('Sealed & saved.')
      setTimeout(() => setSaveMsg(''), 2500)
    } finally {
      setSaving(false)
    }
  }

  function applyAndPersist(updated) {
    const renumbered = updated.map((e, i) => ({ ...e, rank: i + 1 }))
    setEnemies(renumbered)
    persist(renumbered)
  }

  function handleLogin(t) {
    saveToken(t)
    setToken(t)
    setShowLogin(false)
  }

  async function handleLogout() {
    try { await fetch('/api/logout', { method: 'POST', headers: authHeaders() }) } catch {}
    clearToken()
    setToken(null)
    setEditing(false)
  }

  function handleModalSave(updated) {
    let next
    if (updated.id) {
      next = enemies.map((e) => (e.id === updated.id ? updated : e))
    } else {
      const newEntry = { ...updated, id: crypto.randomUUID() }
      next = [...enemies, newEntry]
    }
    applyAndPersist(next)
    setModal(null)
  }

  function handleDelete(id) {
    applyAndPersist(enemies.filter((e) => e.id !== id))
  }

  function handleMove(idx, dir) {
    const next = [...enemies]
    const swapIdx = idx + dir
    if (swapIdx < 0 || swapIdx >= next.length) return
    ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
    applyAndPersist(next)
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className={styles.page}>

      {/* Top-right auth controls */}
      <div className={styles.topBar}>
        {token ? (
          <>
            <button
              className={`${styles.topBtn} ${isEditing ? styles.topBtnActive : ''}`}
              onClick={() => setEditing((v) => !v)}
            >
              {isEditing ? '🔒 Lock the Board' : '✎ Edit the Register'}
            </button>
            <button className={styles.topBtnLogout} onClick={handleLogout}>Depart</button>
          </>
        ) : (
          <button className={styles.topBtn} onClick={() => setShowLogin(true)}>🗝 Enter</button>
        )}
      </div>

      {/* ── Bulletin Board ──────────────────────────────────── */}
      <div className={styles.bulletinBoard}>

        {/* Corner nails */}
        <div className={`${styles.nail} ${styles.nailTL}`} />
        <div className={`${styles.nail} ${styles.nailTR}`} />
        <div className={`${styles.nail} ${styles.nailBL}`} />
        <div className={`${styles.nail} ${styles.nailBR}`} />

        <div className={styles.corkSurface}>

          {/* ── Scroll ──────────────────────────────────────── */}
          <div className={`${styles.scroll} ${scrollOpen ? styles.scrollOpen : ''}`}>

            {/* Top wooden roller */}
            <div className={styles.scrollRoller} />

            {/* Parchment */}
            <div className={styles.scrollContent}>

              {/* Always-visible header — click to expand/collapse */}
              <div
                className={styles.scrollHeader}
                onClick={() => setScrollOpen((v) => !v)}
                role="button"
                aria-expanded={scrollOpen}
              >
                <div className={styles.crossedSwords}>⚔ ✦ ⚔</div>
                <p className={styles.herald}>By Royal Decree of</p>
                <h1 className={styles.title}>Avery Thornton</h1>
                <p className={styles.subtitle}>
                  <em>Official Register of Enemies, Miscreants &amp; Persons of Ill Repute</em>
                </p>
                <p className={styles.herald}>Listed in Order of Severity of Offence</p>
                <div className={styles.crossedSwords}>✦ ✦ ✦</div>
                <div className={styles.scrollToggle}>
                  {scrollOpen ? '▲ Roll Up the Scroll' : '▼ Unroll the Scroll'}
                </div>
              </div>

              {/* Expandable body — the full enemy list */}
              <div className={styles.scrollBody}>
                <div className={styles.boardHeader}>
                  <span>— NOTICE BOARD —</span>
                </div>

                {isEditing && (
                  <div className={styles.editBanner}>
                    <span>
                      {saving ? '⏳ Sealing the record...' : saveMsg || '✎ Edit mode — move, amend, or strike entries from the register'}
                    </span>
                    <button
                      className={styles.addBtn}
                      onClick={() => setModal({ enemy: { id: '', name: '', offense: '', description: '', seal: '⚔' } })}
                    >
                      + Add to the Register
                    </button>
                  </div>
                )}

                {loading ? (
                  <p className={styles.loading}>Consulting the scrolls...</p>
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
                  <p>✦ &nbsp; Cross Lady Avery and find thyself upon this list &nbsp; ✦</p>
                  <p className={styles.footerSub}>Updated as offences are committed &mdash; Anno Domini, Ongoing</p>
                </footer>
              </div>
            </div>

            {/* Bottom wooden roller — slides in when open */}
            <div className={styles.scrollRollerBottom} />

          </div>{/* end .scroll */}
        </div>{/* end .corkSurface */}
      </div>{/* end .bulletinBoard */}

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
    </div>
  )
}
