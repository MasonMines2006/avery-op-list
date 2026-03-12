import express from 'express'
import cors from 'cors'
import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { randomUUID } from 'crypto'
import * as dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_FILE = join(__dirname, 'data.json')
const PASSWORD = process.env.OP_PASSWORD || 'avery123'
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(express.json())

// In-memory token store: token -> expiry timestamp
const sessions = new Map()
const SESSION_TTL = 1000 * 60 * 60 * 8 // 8 hours

function readData() {
  return JSON.parse(readFileSync(DATA_FILE, 'utf8'))
}

function writeData(data) {
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
}

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
  if (!password || password !== PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' })
  }
  const token = randomUUID()
  sessions.set(token, Date.now() + SESSION_TTL)
  res.json({ token })
})

// POST /api/logout
app.post('/api/logout', requireAuth, (req, res) => {
  sessions.delete(req.headers['x-auth-token'])
  res.json({ ok: true })
})

// GET /api/enemies  — public
app.get('/api/enemies', (_req, res) => {
  const { enemies } = readData()
  res.json(enemies)
})

// PUT /api/enemies  — full replace, auth required
app.put('/api/enemies', requireAuth, (req, res) => {
  const { enemies } = req.body
  if (!Array.isArray(enemies)) return res.status(400).json({ error: 'Bad data' })
  writeData({ enemies })
  res.json({ ok: true })
})

app.listen(PORT, () => console.log(`Op List server running on :${PORT}`))
