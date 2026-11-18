// Automatic SQLite backups.
//
// Uses SQLite's online backup API (db.backup), which is safe while the app is
// running and in WAL mode. A plain file copy is NOT safe in that situation.
// Each backup is written to a temporary name first and renamed when complete,
// so a crash can never leave a half-written file that looks like a valid backup.
import fs from 'node:fs'
import path from 'node:path'

const PREFIX = 'personal-os-'
const SUFFIX = '.sqlite'

// "2026-11-18T06-30-00-000Z" is filesystem-safe and sorts oldest -> newest.
const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-')

export const listBackups = directory => {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory)
    .filter(name => name.startsWith(PREFIX) && name.endsWith(SUFFIX))
    .sort()
}

export const pruneBackups = (directory, keep) => {
  const files = listBackups(directory)
  const removable = files.slice(0, Math.max(0, files.length - keep))
  for (const name of removable) fs.rmSync(path.join(directory, name), { force: true })
  return removable
}

export const runBackup = async ({ db, directory, keep }) => {
  fs.mkdirSync(directory, { recursive: true })
  const finalName = `${PREFIX}${timestamp()}${SUFFIX}`
  const finalPath = path.join(directory, finalName)
  const partialPath = `${finalPath}.partial`
  try {
    await db.backup(partialPath)
    fs.renameSync(partialPath, finalPath)
  } catch (error) {
    fs.rmSync(partialPath, { force: true })
    throw error
  }
  pruneBackups(directory, keep)
  return finalPath
}

// Starts the schedule and returns a stop function. An interval of 0 disables backups.
export const startBackups = ({ db, directory, intervalHours, keep, log = console }) => {
  if (!(intervalHours > 0)) {
    log.warn('Automatic backups are disabled (BACKUP_INTERVAL_HOURS=0).')
    return () => {}
  }
  const intervalMs = intervalHours * 60 * 60 * 1000
  let running = false

  const tick = async () => {
    if (running) return
    running = true
    try {
      const file = await runBackup({ db, directory, keep })
      log.log(`Database backup written: ${file}`)
    } catch (error) {
      log.error('Database backup failed:', error)
    } finally {
      running = false
    }
  }

  // After a restart, only back up right away if the newest backup is already due.
  const latest = listBackups(directory).at(-1)
  const latestAge = latest ? Date.now() - fs.statSync(path.join(directory, latest)).mtimeMs : Infinity
  if (latestAge >= intervalMs) void tick()

  const timer = setInterval(tick, intervalMs)
  timer.unref()
  return () => clearInterval(timer)
}
