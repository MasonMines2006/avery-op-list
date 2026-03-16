import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data.json')
const PASSWORD  = process.env.OP_PASSWORD || 'avery123'
const PORT      = process.env.PORT || 3001

// ── Notification config ─────────────────────────────────────
const NOTIFY_EMAIL   = process.env.NOTIFY_EMAIL    // address to send TO
const SMTP_USER      = process.env.SMTP_USER       // e.g. your Gmail address
const SMTP_PASS      = process.env.SMTP_PASS       // Gmail app password
const SMTP_HOST      = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT_NUM  = parseInt(process.env.SMTP_PORT || '587')
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK  // Discord, ntfy.sh, etc.

// ── HTML email builder ──────────────────────────────────────
function buildHtmlEmail(subject, lines) {
  const rows = lines.map(l => `<tr><td style="padding:6px 0;border-bottom:1px solid #c8a04a33;font-family:'Georgia',serif;font-size:14px;color:#3d1200;">${l}</td></tr>`).join('')
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="background:#1a0800;margin:0;padding:24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(160deg,#f5e9c8,#ede0b0);border:3px solid #7a4800;border-radius:4px;padding:28px 32px;">
        <div style="text-align:center;font-size:22px;letter-spacing:8px;color:#6b3d00;margin-bottom:8px;">⚔ ✦ ⚔</div>
        <h1 style="font-family:'Georgia',serif;font-size:22px;color:#3d1200;text-align:center;margin:0 0 4px;">${subject}</h1>
        <p style="font-family:'Georgia',serif;font-size:12px;color:#7a5020;text-align:center;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px;">By Royal Decree of Avery Thornton</p>
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        <div style="text-align:center;font-family:'Georgia',serif;font-size:11px;color:#a07030;margin-top:20px;border-top:1px solid #c8a04a55;padding-top:12px;">
          ✦ Cross Lady Avery and find thyself upon this list ✦
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Shared send helper ──────────────────────────────────────
async function dispatchNotification(subject, lines) {
  const results = {}

  if (NOTIFY_WEBHOOK) {
    try {
      const body = lines.join('\n')
      // Support Discord (content), ntfy.sh (message/title), and generic (both)
      await fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subject,
          content: `**${subject}**\n${body}`,  // Discord markdown
          message: body,                         // ntfy.sh / generic
        }),
      })
      results.webhook = 'sent'
    } catch (e) {
      results.webhook = `failed: ${e.message}`
      console.error('Webhook notify failed:', e.message)
    }
  }

  if (NOTIFY_EMAIL && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT_NUM,
        secure: SMTP_PORT_NUM === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"Avery's Op List" <${SMTP_USER}>`,
        to: NOTIFY_EMAIL,
        subject,
        text: lines.join('\n'),
        html: buildHtmlEmail(subject, lines),
      })
      results.email = 'sent'
    } catch (e) {
      results.email = `failed: ${e.message}`
      console.error('Email notify failed:', e.message)
    }
  }

  return results
}

// ── Change detection & notification ────────────────────────
async function sendNotification(oldEnemies, newEnemies) {
  if (!NOTIFY_EMAIL && !NOTIFY_WEBHOOK) return

  const oldMap = new Map(oldEnemies.map(e => [e.id, e]))
  const newMap = new Map(newEnemies.map(e => [e.id, e]))
  const added   = newEnemies.filter(e => !oldMap.has(e.id))
  const removed = oldEnemies.filter(e => !newMap.has(e.id))
  const reranked = newEnemies.filter(e => {
    const old = oldMap.get(e.id)
    return old && old.rank !== e.rank
  })

  const top = newEnemies[0]
  const lines = []

  if (added.length)    lines.push(`☠ Added: ${added.map(e => e.name).join(', ')}`)
  if (removed.length)  lines.push(`✕ Removed: ${removed.map(e => e.name).join(', ')}`)
  if (reranked.length && !added.length && !removed.length) lines.push('⚔ Register reordered')
  if (top) lines.push(`#1 Most Wanted: ${top.name} — ${top.offense}`)
  lines.push(`Total entries: ${newEnemies.length}`)
  lines.push(`Updated: ${new Date().toLocaleString()}`)

  await dispatchNotification("Avery's Op List Updated", lines)
}

// ── Express setup ───────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

const sessions    = new Map()
const SESSION_TTL = 1000 * 60 * 60 * 8

function readData()      { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
function writeData(data) { writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)) }

function requireAuth(req, res, next) {
  const token = req.headers['x-auth-token']
  if (!token) return res.status(401).json({ error: 'No token' })
  const expiry = sessions.get(token)
  if (!expiry || Date.now() > expiry) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Session expired' })
  }
  next()
}

// POST /api/login
app.post('/api/login', (req, res) => {
  const { password } = req.body
  if (!password || password !== PASSWORD) return res.status(401).json({ error: 'Wrong password' })
  const token = randomUUID()
  sessions.set(token, Date.now() + SESSION_TTL)
  res.json({ token })
})

// POST /api/logout
app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers['x-auth-token'])
  res.json({ ok: true })
})

// GET /api/enemies — public
app.get('/api/enemies', (_req, res) => {
  const { enemies } = readData()
  res.json(enemies)
})

// PUT /api/enemies — full replace, auth required
app.put('/api/enemies', requireAuth, (req, res) => {
  const { enemies } = req.body
  if (!Array.isArray(enemies)) return res.status(400).json({ error: 'Bad data' })
  const { enemies: oldEnemies } = readData()
  writeData({ enemies })
  res.json({ ok: true })
  // Fire notification after responding (non-blocking)
  sendNotification(oldEnemies, enemies).catch(console.error)
})

// GET /api/notify/status — which channels are configured (public)
app.get('/api/notify/status', (_req, res) => {
  res.json({
    email:   !!(NOTIFY_EMAIL && SMTP_USER && SMTP_PASS),
    webhook: !!NOTIFY_WEBHOOK,
  })
})

// POST /api/notify/test — send a test notification (auth required)
app.post('/api/notify/test', requireAuth, async (_req, res) => {
  if (!NOTIFY_EMAIL && !NOTIFY_WEBHOOK) {
    return res.status(400).json({
      error: 'No notification targets configured. Set NOTIFY_EMAIL or NOTIFY_WEBHOOK in your .env file.',
    })
  }

  const lines = [
    '⚔ The notification system doth function correctly.',
    `Fired at: ${new Date().toLocaleString()}`,
    '✦ Long may the register endure ✦',
  ]

  try {
    const results = await dispatchNotification("Avery's Op List — Test Notification", lines)
    res.json({ ok: true, results })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
})

app.listen(PORT, () => console.log(`Op List server running on :${PORT}`))
