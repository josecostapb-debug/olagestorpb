'use strict';
// Build determinístico para deploy (mesmo padrão do Portal dos Animais).
// 1. Compila o backend (tsc) → dist/
// 2. Builda o frontend (vite) → frontend/dist
// 3. Copia o frontend buildado para dist/public (dentro do dist publicável pelo painel)
const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const frontendDist = path.join(root, 'frontend', 'dist');
const backendDist = path.join(root, 'dist');
const publicDir = path.join(backendDist, 'public');

function run(cmd, cwd) {
  console.log(`\n> ${cmd}  (cwd: ${path.relative(root, cwd) || '.'})`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

// 1. Backend
run('tsc', root);

// 2. Frontend (vite build no diretório frontend)
if (!fs.existsSync(path.join(root, 'frontend', 'node_modules'))) {
  console.log('\n[build-app] instalando dependências do frontend...');
  run('npm ci --include=dev', path.join(root, 'frontend'));
}
run('npm run build', path.join(root, 'frontend'));

// 3. Copiar frontend buildado para dist/public
if (!fs.existsSync(path.join(frontendDist, 'index.html'))) {
  console.error(`\n[build-app] ERRO: index.html não gerado em ${path.relative(root, frontendDist)}`);
  process.exit(1);
}
rmrf(publicDir);
copyDir(frontendDist, publicDir);
console.log(`\n[build-app] frontend copiado para ${path.relative(root, publicDir)} (contém index.html)`);

// 4. Garantir que dist/index.js existe
if (!fs.existsSync(path.join(backendDist, 'index.js'))) {
  console.error('\n[build-app] ERRO: dist/index.js não gerado pelo tsc');
  process.exit(1);
}

console.log('\n[build-app] build concluído com sucesso.');