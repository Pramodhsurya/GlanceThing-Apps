import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })

const apps = fs
  .readdirSync(root, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .filter(name => fs.existsSync(path.join(root, name, 'manifest.json')))

for (const name of apps) {
  const dir = path.join(root, name)
  const manifest = JSON.parse(
    fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8')
  )
  const version = String(manifest.version || '0.0.0').replace(/^v/, '')
  const zipName = `${manifest.id}-app-v${version}.zip`
  const zipPath = path.join(dist, zipName)
  const client = path.join(dir, 'client')
  const shared = ['gt.js', 'base.css']

  for (const file of shared) {
    const from = path.join(root, 'lib', file)
    if (fs.existsSync(from) && fs.existsSync(client)) {
      fs.copyFileSync(from, path.join(client, file))
    }
  }

  const files = ['manifest.json']
  if (fs.existsSync(client)) files.push('client')

  execSync(`zip -r "${zipPath}" ${files.join(' ')}`, {
    cwd: dir,
    stdio: 'inherit'
  })
  console.log('wrote', zipName)
}

console.log(`\nPackaged ${apps.length} apps into dist/`)
