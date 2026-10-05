import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const python = fileURLToPath(new URL(process.platform === 'win32' ? '../backend/.venv/Scripts/python.exe' : '../backend/.venv/bin/python', import.meta.url))
if (!existsSync(python)) {
  console.error('Create backend/.venv and install requirements-dev.txt before running browser tests. See README.')
  process.exit(1)
}
const child = spawn(python, ['-m', 'scripts.run_e2e', ...process.argv.slice(2)], { cwd: `${root}/backend`, stdio: 'inherit', windowsHide: true })
child.on('error', (error) => { console.error(error.message); process.exitCode = 1 })
child.on('exit', (code) => { process.exitCode = code ?? 1 })
