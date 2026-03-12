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
const SMTP_PORT      = parseInt(process.env.SMTP_PORT || '587')
const NOTIFY_WEBHOOK = process.env.NOTIFY_WEBHOOK  // any POST webhook URL (Discord, ntfy.sh, etc.)

// ── Notification sender ─────────────────────────────────────
async function sendNotification(oldEnemies, newEnemies) {
  if (!NOTIFY_EMAIL && !NOTIFY_WEBHOOK) return

  const oldMap = new Map(oldEnemies.map(e => [e.id, e]))
  const newMap = new Map(newEnemies.map(e => [e.id, e]))
  const added   = newEnemies.filter(e => !oldMap.has(e.id))
  const removed = oldEnemies.filter(e => !newMap.has(e.id))
  const top     = newEnemies[0]

  const lines = []
  if (added.length)   lines.push(`Added: ${added.map(e => e.name).join(', ')}`)
  if (removed.length) lines.push(`Removed: ${removed.map(e => e.name).join(', ')}`)
  if (!added.length && !removed.length) lines.push('Register reordered')
  if (top) lines.push(`Most Wanted: ${top.name}`)
  lines.push(`Total entries: ${newEnemies.length}`)
  lines.push(`Updated: ${new Date().toLocaleString()}`)

  const subject = `Avery's Op List Updated`
  const body    = lines.join('\n')

  if (NOTIFY_WEBHOOK) {
    try {
      await fetch(NOTIFY_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: subject, message: body }),
      })
    } catch (e) { console.error('Webhook notify failed:', e.message) }
  }

  if (NOTIFY_EMAIL && SMTP_USER && SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      })
      await transporter.sendMail({
        from: `"Avery's Op List" <${SMTP_USER}>`,
        to: NOTIFY_EMAIL,
        subject,
        text: body,
      })
    } catch (e) { console.error('Email notify failed:', e.message) }
  }
}

// ── Express setup ───────────────────────────────────────────
const app = express()
app.use(cors())
app.use(express.json())

const sessions   = new Map()
const SESSION_TTL = 1000 * 60 * 60 * 8

function readData()     { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
function writeData(data){ writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)) }

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

app.listen(PORT, () => console.log(`Op List server running on :${PORT}`))
