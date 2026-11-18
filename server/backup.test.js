import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import Database from 'better-sqlite3'
import { listBackups, pruneBackups, runBackup } from './backup.js'

const makeDb = directory => {
  const db = new Database(path.join(directory, 'live.sqlite'))
  db.pragma('journal_mode = WAL')
  db.exec('CREATE TABLE notes (id INTEGER PRIMARY KEY, body TEXT)')
  db.prepare('INSERT INTO notes (body) VALUES (?)').run('hello')
  return db
}

test('a backup is a complete, readable copy of the live database', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'po-backup-'))
  const db = makeDb(dir)
  const file = await runBackup({ db, directory: path.join(dir, 'backups'), keep: 3 })
  db.prepare('INSERT INTO notes (body) VALUES (?)').run('added later')

  const copy = new Database(file, { readonly: true })
  assert.deepEqual(copy.prepare('SELECT body FROM notes').all(), [{ body: 'hello' }])
  copy.close()
  assert.equal(fs.readdirSync(path.join(dir, 'backups')).some(name => name.endsWith('.partial')), false)
  db.close()
  fs.rmSync(dir, { recursive: true, force: true })
})

test('only the newest N backups are kept', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'po-backup-'))
  const db = makeDb(dir)
  const backups = path.join(dir, 'backups')
  for (let i = 0; i < 4; i += 1) {
    await runBackup({ db, directory: backups, keep: 2 })
    await new Promise(resolve => setTimeout(resolve, 5))
  }
  assert.equal(listBackups(backups).length, 2)
  assert.deepEqual(pruneBackups(backups, 5), [])
  db.close()
  fs.rmSync(dir, { recursive: true, force: true })
})
