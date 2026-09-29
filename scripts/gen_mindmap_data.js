#!/usr/bin/env node
/* ==========================================================================
   GENESIS - GERADOR DE DADOS DO MAPA MENTAL 3D
   --------------------------------------------------------------------------
   Uso:  node scripts/gen_mindmap_data.js            (re-escreve os dados)
         node scripts/gen_mindmap_data.js --quiet    (sem relatorio)

   O QUE FAZ
     1. Percorre o repositorio real (backend, frontend, admin-frontend,
        scripts, documentos) e recolhe TODOS os ficheiros relevantes.
     2. Descobre as ligacoes entre eles lendo os `import` / `require` /
        `@import` de cada ficheiro e resolvendo para o ficheiro REAL.
     3. Cruza com `Mapa Mental/mapa_mental_status.json` (a fonte de verdade
        curada: estado + descricao + notas). O que nao estiver la fica
        classificado como "untracked" (cinzento) - nunca inventa estado.
     4. Escreve `Mapa Mental/mapa_mental_data.js`, que o
        `Mapa Mental/mapa_mental_3d.html` carrega com um <script src>.
        (Script e nao fetch: o HTML tem de abrir com duplo-clique em file://.

   CORES / ESTADOS
     ok        VERDE   - funciona e esta pronto
     partial   LARANJA - incompleto, pode ou nao estar a funcionar
     broken    VERMELHO- nao roda, nao funciona, ou tem falha de seguranca
     planned   AZUL    - ainda nao existe; planeado (o no aparece "fantasma")
     untracked CINZENTO- ficheiro real que ainda nao foi classificado
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_FILE = path.join(ROOT, 'Mapa Mental', 'mapa_mental_data.js');
const STATUS_FILE = path.join(ROOT, 'Mapa Mental', 'mapa_mental_status.json');

// --------------------------------------------------------------------------
// 1. Regras de varrimento
// --------------------------------------------------------------------------
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'coverage', '.vite', '.cache',
  '.turbo', 'playwright-report', 'test-results', 'tmp', 'temp', '.github',
  // Saidas de ferramentas (esbuild/Vite) usadas so para verificar sintaxe.
  'out', 'out-esbuild', 'out-check', '.output',
]);

const CODE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
const ASSET_EXT = new Set(['.css', '.html', '.json', '.sql', '.prisma', '.sh', '.cmd', '.bat', '.ps1', '.md', '.txt', '.yml', '.yaml']);

const SKIP_FILES = new Set([
  'mapa_mental_data.js',
  '_class_inventory.txt',
  'package-lock.json',
  'CHANGELOG_AUTOMATED.md',
  'lovable-mcp.json',
  'plan_update.md',
  'start.sh',
  'test.sh',
  'stop.sh',
  'stop.ps1',
  'stop.bat',
  'run-local.sh',
  'run-local.ps1',
  'run-local.bat',
  'run-admin.bat',
]);

// Ficheiros de rascunho/auditoria que nunca devem poluir o mapa.
// (notas soltas deixadas por sessoes anteriores, ficheiros "(copy 1)")
const SKIP_PATTERNS = [
  /^_/,                     // _p4000.txt, _verify_*.txt, etc.
  /(^|\/)_/,                // backend/_run4020.cmd
  /\(copy \d+\)/,           // e2e_test2 (copy 1).js
  /^(bl|final-build)\.txt$/,
  /^Oque ja fiz/,
  /^atualizar_GITHUB/,
  /^DownloadNode/,
  /^tmp_/,                  // tmp_post_*.js (scripts temporarios)
];


// --------------------------------------------------------------------------
// 2. Grupos (aglomerados) - o primeiro nivel da pasta decide o grupo
// --------------------------------------------------------------------------
const GROUP_RULES = [
  { id: 'backend', label: 'Backend (API)', match: /^backend\/src\//, tone: '#e50914' },
  { id: 'backend-data', label: 'Backend - Dados e Testes', match: /^backend\/(prisma|scripts|tests|data)\/|^backend\/verify_hash\.js$/, tone: '#8f0a11' },
  { id: 'frontend', label: 'Frontend (Owner/POS)', match: /^frontend\/src\/|^frontend\/(tests|scripts)\//, tone: '#3b82f6' },
  { id: 'frontend-pub', label: 'Frontend - Config', match: /^frontend\/(public\/|index\.html|vite\.config|tailwind\.config|postcss)/, tone: '#0ea5e9' },
  { id: 'admin', label: 'Super Admin', match: /^admin-frontend\//, tone: '#a855f7' },
  { id: 'scripts', label: 'Automatismos / Scripts', match: /^scripts\/|^run-localhost/, tone: '#22c55e' },
  { id: 'docs', label: 'Documentos', match: /^docs\/|^plan\.md$|^Mapa Mental\/|^README|^Prompt_Mestre|^\.md$/, tone: '#f59e0b' },
  { id: 'infra', label: 'Infra / Raiz', match: /(^|\/)(package\.json|\.env)|^run-|^start|^stop|^test(\/|$)|\.ps1$/, tone: '#94a3b8' },
];


function groupOf(fileRel) {
  for (const rule of GROUP_RULES) {
    if (rule.match.test(fileRel)) return rule.id;
  }
  return 'infra';
}

// --------------------------------------------------------------------------
// 3. Leitura do disco
// --------------------------------------------------------------------------
function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join('/');
}

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env' && entry.name !== '.env.example') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(full, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!CODE_EXT.has(ext) && !ASSET_EXT.has(ext)) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      const r = rel(full);
      if (SKIP_PATTERNS.some((re) => re.test(entry.name) || re.test(r))) continue;
      out.push(r);
    }
  }
  return out;
}

// --------------------------------------------------------------------------
// 4. Extracao de ligacoes (import / require / @import)
// --------------------------------------------------------------------------
const RE_IMPORT = /import\s+(?:[\s\S]*?\sfrom\s+)?['"]([^'"]+)['"]/g;
const RE_REQUIRE = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_DYNAMIC = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_CSS_IMPORT = /@import\s+(?:url\()?['"]([^'"]+)['"]/g;

function extractSpecifiers(fileRel, source) {
  const found = new Set();
  const run = (re) => {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(source)) !== null) {
      if (m[1] && !m[1].startsWith('data:')) found.add(m[1]);
    }
  };
  run(RE_IMPORT);
  run(RE_REQUIRE);
  run(RE_DYNAMIC);
  if (fileRel.endsWith('.css')) run(RE_CSS_IMPORT);
  return [...found];
}

const RESOLVE_EXT = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.css', '.json'];

// Resolve './x' ou '../y' para um ficheiro que existe mesmo no disco.
function resolveLocal(fromRel, spec, allFiles) {
  if (!spec.startsWith('.')) return null; // pacote externo (node_modules)
  const baseDir = path.posix.dirname(fromRel);
  const target = path.posix.normalize(path.posix.join(baseDir, spec));
  const candidates = [target, ...RESOLVE_EXT.map((e) => target + e)];
  RESOLVE_EXT.forEach((e) => candidates.push(path.posix.join(target, 'index' + e)));
  const ext = path.posix.extname(target);
  if (ext) {
    RESOLVE_EXT.forEach((e) => candidates.push(target.slice(0, -ext.length) + e));
  }
  for (const c of candidates) {
    if (allFiles.has(c)) return c;
  }
  return null;
}

// --------------------------------------------------------------------------
// 5. Classificacao automatica conservadora
// --------------------------------------------------------------------------
// NUNCA adivinha "ok": se o ficheiro nao esta no mapa curado, fica cinzento.
function autoStatus() {
  return 'untracked';
}

const VALID_STATUS = new Set(['ok', 'partial', 'broken', 'planned', 'untracked']);

// --------------------------------------------------------------------------
// 6. Programa principal
// --------------------------------------------------------------------------
function main() {
  const quiet = process.argv.includes('--quiet');

  const files = walk(ROOT, []).sort();
  const allFiles = new Set(files);

  let curated = { files: {} };
  if (fs.existsSync(STATUS_FILE)) {
    try {
      curated = JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    } catch (err) {
      console.error('[gen_mindmap] mapa_mental_status.json invalido:', err.message);
      process.exitCode = 1;
      return;
    }
  }
  const curatedFiles = curated.files || {};

  const nodes = [];
  const links = [];
  const seenLink = new Set();
  const externalUse = new Map();

  for (const fileRel of files) {
    const abs = path.join(ROOT, fileRel);
    let source = '';
    let size = 0;
    let lines = 0;
    try {
      const stat = fs.statSync(abs);
      size = stat.size;
      if (size < 900 * 1024) {
        source = fs.readFileSync(abs, 'utf8');
        lines = source.split('\n').length;
      }
    } catch (err) { /* ficheiro binario ou bloqueado */ }

    const specifiers = extractSpecifiers(fileRel, source);
    const dependsOn = [];
    const externals = [];

    for (const spec of specifiers) {
      const target = resolveLocal(fileRel, spec, allFiles);
      if (target) {
        dependsOn.push(target);
        const key = fileRel + ' -> ' + target;
        if (!seenLink.has(key)) {
          seenLink.add(key);
          links.push({ source: fileRel, target });
        }
      } else if (!spec.startsWith('.')) {
        const pkg = spec.startsWith('@') ? spec.split('/').slice(0, 2).join('/') : spec.split('/')[0];
        externals.push(pkg);
        externalUse.set(pkg, (externalUse.get(pkg) || 0) + 1);
      }
    }

    const cur = curatedFiles[fileRel];
    let status = cur && cur.status ? cur.status : autoStatus();
    if (!VALID_STATUS.has(status)) status = 'untracked';

    nodes.push({
      id: fileRel,
      path: fileRel,
      label: path.posix.basename(fileRel),
      group: (cur && cur.group) || groupOf(fileRel),
      dir: path.posix.dirname(fileRel),
      ext: path.posix.extname(fileRel).toLowerCase(),
      status,
      summary: (cur && cur.summary) || '',
      notes: (cur && cur.notes) || '',
      role: (cur && cur.role) || '',
      security: (cur && cur.security) || '',
      planned: false,
      lines,
      size,
      externals: [...new Set(externals)],
      dependsOn: [...new Set(dependsOn)],
      usedBy: [],
      inbound: 0,
      outbound: 0,
    });
  }

  // --- Nos planeados (azuis) que ainda nao existem no disco --------------
  for (const [fileRel, cur] of Object.entries(curatedFiles)) {
    if (nodes.some((n) => n.id === fileRel)) continue;
    if (!cur || !cur.planned) continue;
    nodes.push({
      id: fileRel,
      path: fileRel,
      label: path.posix.basename(fileRel),
      group: cur.group || groupOf(fileRel),
      dir: path.posix.dirname(fileRel),
      ext: path.posix.extname(fileRel).toLowerCase(),
      status: 'planned',
      summary: cur.summary || '',
      notes: cur.notes || '',
      role: cur.role || '',
      security: cur.security || '',
      planned: true,
      lines: 0,
      size: 0,
      externals: [],
      dependsOn: cur.dependsOn || [],
      usedBy: [],
      inbound: 0,
      outbound: (cur.dependsOn || []).length,
    });
    for (const dep of cur.dependsOn || []) {
      const key = fileRel + ' -> ' + dep;
      if (!seenLink.has(key)) {
        seenLink.add(key);
        links.push({ source: fileRel, target: dep });
      }
    }
  }

  // --- Backlinks ---------------------------------------------------------
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const resolvedLinks = [];
  for (const link of links) {
    const src = byId.get(link.source);
    const dst = byId.get(link.target);
    if (!src || !dst) continue; // alvo planeado que nao existe nem esta curado
    if (!dst.usedBy.includes(link.source)) dst.usedBy.push(link.source);
    resolvedLinks.push(link);
  }
  for (const node of nodes) {
    node.outbound = (node.dependsOn || []).filter((d) => byId.has(d)).length;
    node.inbound = node.usedBy.length;
  }

  // --- Aglomerados -------------------------------------------------------
  // Cada grupo tem um sub-aglomerado por pasta (para se ver a hierarquia).
  const groups = {};
  for (const node of nodes) {
    if (!groups[node.group]) {
      const rule = GROUP_RULES.find((r) => r.id === node.group);
      groups[node.group] = {
        id: node.group,
        label: (rule && rule.label) || node.group,
        tone: (rule && rule.tone) || '#94a3b8',
        nodes: 0,
        clusters: {},
      };
    }
    const g = groups[node.group];
    g.nodes += 1;
    g.clusters[node.dir] = (g.clusters[node.dir] || 0) + 1;
  }

  const statusCount = { ok: 0, partial: 0, broken: 0, planned: 0, untracked: 0 };
  for (const node of nodes) statusCount[node.status] = (statusCount[node.status] || 0) + 1;

  const payload = {
    generatedAt: new Date().toISOString(),
    generator: 'scripts/gen_mindmap_data.js',
    curatedFrom: 'Mapa Mental/mapa_mental_status.json',
    project: 'Genesis',
    totals: {
      files: nodes.filter((n) => !n.planned).length,
      planned: nodes.filter((n) => n.planned).length,
      links: resolvedLinks.length,
      lines: nodes.reduce((acc, n) => acc + (n.lines || 0), 0),
      byStatus: statusCount,
      byGroup: Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.nodes])),
    },
    topExternals: [...externalUse.entries()].sort((a, b) => b[1] - a[1]).slice(0, 24)
      .map(([pkg, count]) => ({ pkg, count })),
    groups: Object.values(groups),
    nodes,
    links: resolvedLinks,
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  const banner =
    '/* GERADO AUTOMATICAMENTE por scripts/gen_mindmap_data.js - NAO EDITAR A MAO.\n' +
    '   Fonte de verdade curada: ' + payload.curatedFrom + '\n' +
    '   Gerado em: ' + payload.generatedAt + ' */\n';
  fs.writeFileSync(
    OUT_FILE,
    banner + 'window.GENESIS_MINDMAP = ' + JSON.stringify(payload, null, 1) + ';\n',
    'utf8',
  );

  if (!quiet) {
    console.log('[gen_mindmap] escrito Mapa Mental/mapa_mental_data.js');
    console.log('  ficheiros reais  :', payload.totals.files);
    console.log('  planeados        :', payload.totals.planned);
    console.log('  ligacoes         :', payload.totals.links);
    console.log('  linhas de codigo :', payload.totals.lines);
    console.log('  estados          :', JSON.stringify(statusCount));
    console.log('  grupos           :', JSON.stringify(payload.totals.byGroup));
    if (statusCount.untracked) {
      console.log('');
      console.log('  AVISO: ' + statusCount.untracked + ' ficheiros por classificar (cinzento).');
      console.log('  Para os pintar, acrescenta entradas em Mapa Mental/mapa_mental_status.json.');
    }
  }
}

main();




