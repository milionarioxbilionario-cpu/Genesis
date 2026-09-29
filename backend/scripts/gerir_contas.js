// ===========================================================================
//  GESTAO DE CONTAS E SENHAS DO GENESIS
//  node scripts/gerir_contas.js
//
//  ---------------------------------------------------------------------------
//  PORQUE E QUE ESTE SCRIPT EXISTE (e o que ele NAO pode fazer)
//  ---------------------------------------------------------------------------
//  As senhas do Genesis estao guardadas com BCRYPT, custo 12
//  (ver src/routes/auth.js -> bcrypt.hash(password, 12)). O bcrypt e um hash de
//  sentido UNICO: nao existe forma matematica de voltar do hash para a senha.
//  Nao existe "desencriptar", e nao ha porta dos fundos para isso.
//
//  Por isso este script, em vez de "listar as senhas", faz o unico possivel:
//
//    1. VERIFICAR  -> "a senha que eu sei e a desta conta?" (bcrypt.compare)
//    2. DEFINIR    -> escolhe uma senha nova e guarda o novo hash bcrypt
//    3. GERAR      -> cria uma senha forte e aplica-a
//    4. REPOR      -> volta a pôr a senha que esta no .env (DEMO_*_PASSWORD)
//
//  Para te servir, o script compara as senhas do .env com TODAS as contas e diz
//  a que conta cada uma pertence. Assim sabes sempre qual usas.
//
//  SEGURANCA
//   - As senhas sao escritas de forma mascarada (nao aparecem no ecra).
//   - Nunca e impresso o hash completo, so o algoritmo e o custo.
//   - Cada alteracao fica registada em AuditLog.
//   - Para terminar a script sem tocar em nada: 0
// ===========================================================================

require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../src/utils/prisma');

// O login aceita >=6, mas o reset de senha exige >=8 (auth.js). Usamos 8 para
// nunca criarmos uma senha que o proprio sistema recuse.
const MINIMO = 8;
const CUSTO_BCRYPT = 12; // tem de bater certo com o resto do projecto

const L = {
  reset: '\x1b[0m', negrito: '\x1b[1m', vermelho: '\x1b[31m',
  verde: '\x1b[32m', amarelo: '\x1b[33m', azul: '\x1b[36m', cinzento: '\x1b[90m'
};

const titulo = (t) => {
  console.log('\n' + L.azul + L.negrito + '  ' + t + '  ' + L.reset);
  console.log(L.cinzento + '  ' + '-'.repeat(t.length + 4) + L.reset);
};

// ---------------------------------------------------------------------------
// Perguntar ao utilizador
// ---------------------------------------------------------------------------
function perguntar(pergunta) {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(pergunta, (r) => { rl.close(); resolve(r.trim()); });
  });
}

// Escreve asteriscos em vez da senha. Sem terminal (pipado) le a linha normal.
function perguntarSecreto(pergunta) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) return resolve(perguntar(pergunta));

    process.stdout.write(pergunta);
    const stdin = process.stdin;
    let valor = '';
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    const terminar = () => {
      stdin.removeListener('data', aoTeclar);
      stdin.setRawMode(false);
      stdin.pause();
      process.stdout.write('\n');
      resolve(valor);
    };

    function aoTeclar(pedaco) {
      for (const ch of pedaco) {
        const c = ch.charCodeAt(0);
        if (ch === '\r' || ch === '\n' || c === 4) return terminar();
        if (c === 3) { process.stdout.write('\n'); process.exit(130); }
        if (c === 8 || c === 127) {
          valor = valor.slice(0, -1);
          process.stdout.write('\b \b');
          continue;
        }
        if (c < 32) continue;
        valor += ch;
        process.stdout.write('*');
      }
    }
    stdin.on('data', aoTeclar);
  });
}

// ---------------------------------------------------------------------------
// Senhas candidatas do .env — para descobrir a que conta pertencem
// ---------------------------------------------------------------------------
function senhasDoEnv() {
  return [
    { variavel: 'DEMO_OWNER_PASSWORD', valor: process.env.DEMO_OWNER_PASSWORD },
    { variavel: 'DEMO_CASHIER_PASSWORD', valor: process.env.DEMO_CASHIER_PASSWORD },
    { variavel: 'DEMO_ADMIN_PASSWORD', valor: process.env.DEMO_ADMIN_PASSWORD }
  ].filter((s) => Boolean(s.valor));
}

function gerarSenha() {
  // Base sem caracteres que confundem (0/O, 1/l) para poder ser ditada ao telefone.
  const minusculas = 'abcdefghijkmnpqrstuvwxyz';
  const maiusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numeros = '23456789';
  const simbolos = '!@#$%&*?';
  const todos = minusculas + maiusculas + numeros + simbolos;

  const peca = (conjunto, n) => {
    let s = '';
    for (let i = 0; i < n; i++) s += conjunto[crypto.randomInt(conjunto.length)];
    return s;
  };

  const corpo = peca(todos, 13);
  // Garante pelo menos um de cada classe, depois baralha.
  const partes = [peca(minusculas, 3), peca(maiusculas, 3), peca(numeros, 3), peca(simbolos, 1), corpo];
  for (let i = partes.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [partes[i], partes[j]] = [partes[j], partes[i]];
  }
  return partes.join('');
}

function avaliarSenha(senha) {
  const problemas = [];
  if (senha.length < MINIMO) problemas.push('tem de ter pelo menos ' + MINIMO + ' caracteres');
  if (!/[a-z]/.test(senha)) problemas.push('faltam minusculas');
  if (!/[A-Z]/.test(senha)) problemas.push('faltam maiusculas');
  if (!/[0-9]/.test(senha)) problemas.push('faltam numeros');
  if (!/[^A-Za-z0-9]/.test(senha)) problemas.push('faltam simbolos');
  return problemas;
}

// ---------------------------------------------------------------------------
// Listar contas
// ---------------------------------------------------------------------------
async function listarContas() {
  const [users, tenants] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, is_active: true,
        tenant_id: true, created_at: true, password_hash: true
      },
      orderBy: { email: 'asc' }
    }),
    prisma.tenant.findMany({ select: { id: true, name: true } })
  ]);

  const nomeDaLoja = new Map(tenants.map((t) => [t.id, t.name]));

  titulo('CONTAS (' + users.length + ')');
  console.log(L.cinzento + '  #   EMAIL                              PAPEL         ESTADO   HASH        LOJA' + L.reset);

  users.forEach((u, i) => {
    const n = String(i + 1).padStart(3);
    const email = u.email.length > 32 ? u.email.slice(0, 32) : u.email;
    const estado = u.is_active ? L.verde + 'activo ' + L.reset : L.vermelho + 'INACTIVO' + L.reset;
    const loja = u.tenant_id ? (nomeDaLoja.get(u.tenant_id) || '?') : '(super admin)';
    const hash = (u.password_hash || '-');
    const marca = hash.startsWith('$2') ? hash.slice(0, 7) + L.cinzento + '...' + L.reset
      : L.vermelho + 'SEM SENHA' + L.reset;
    console.log('  ' + n + ' ' + email.padEnd(33) + String(u.role).padEnd(13) + estado + '  ' + marca.padEnd(22) + L.cinzento + loja + L.reset);
    console.log('      ' + L.cinzento + 'nome: ' + u.name + '  |  criada: ' + u.created_at.toISOString().slice(0, 10) + L.reset);
  });

  console.log('\n  ' + L.cinzento + 'As senhas estao em bcrypt: nao se podem ler, so testar ou trocar.' + L.reset);
  console.log('  ' + L.cinzento + 'Usa a opcao 7 para descobrir a que conta pertence cada senha do .env.' + L.reset);
  return users;
}

// ---------------------------------------------------------------------------
// Descobrir a que conta pertence cada senha do .env.
// Sao ~50 comparacoes bcrypt de custo 12, por isso vai em PARALELO e demora
// alguns segundos. E uma opcao a pedido, nunca algo automatico.
// ---------------------------------------------------------------------------
async function identificarSenhasDoEnv(contas) {
  const doEnv = senhasDoEnv();
  if (!doEnv.length) {
    console.log(L.vermelho + '  O .env nao tem nenhuma DEMO_*_PASSWORD definida.' + L.reset);
    return;
  }
  console.log(L.cinzento + '  A comparar ' + contas.length + ' contas com ' + doEnv.length +
    ' senhas do .env (bcrypt custo ' + CUSTO_BCRYPT + ', pode demorar ~10 s)...' + L.reset);

  const inicio = Date.now();
  const resultados = await Promise.all(contas.map(async (c) => {
    if (!c.password_hash) return [c.email, 'SEM SENHA'];
    const r = await Promise.all(doEnv.map((s) =>
      bcrypt.compare(s.valor, c.password_hash).catch(() => false)));
    const i = r.indexOf(true);
    return [c.email, i === -1 ? '(senha definida fora do .env)' : doEnv[i].variavel];
  }));

  titulo('A QUE CONTA PERTENCE CADA SENHA DO .env?');
  resultados.forEach(([email, origem]) => {
    const cor = origem.startsWith('(') ? L.cinzento : L.amarelo;
    console.log('  ' + email.padEnd(36) + cor + origem + L.reset);
  });

  console.log('\n  ' + L.cinzento + 'Resposta honesta: uma senha so se descobre por tentativas' + L.reset);
  console.log('  ' + L.cinzento + '(bcrypt e de sentido unico). Se nao reconhece nenhuma, e porque a' + L.reset);
  console.log('  ' + L.cinzento + 'senha foi mudada fora do .env — entao usa a opcao 2 para pores uma nova.' + L.reset);
  console.log(L.cinzento + '  (' + ((Date.now() - inicio) / 1000).toFixed(1) + ' s)' + L.reset);
}

// ---------------------------------------------------------------------------
// Gravar a senha (com registo em auditoria)
// ---------------------------------------------------------------------------
async function gravarSenha(conta, senhaNova, motivo) {
  const hash = await bcrypt.hash(senhaNova, CUSTO_BCRYPT);
  const confere = await bcrypt.compare(senhaNova, hash);
  if (!confere) throw new Error('o hash gerado nao confere — nada foi gravado');

  await prisma.user.update({ where: { id: conta.id }, data: { password_hash: hash } });

  // Rastro em auditoria. user_id aponta para a propria conta alterada.
  try {
    await prisma.auditLog.create({
      data: {
        user_id: conta.id,
        tenant_id: conta.tenant_id,
        action: 'PASSWORD_CHANGED_VIA_SCRIPT',
        entity_type: 'user',
        entity_id: conta.id,
        old_value: null,
        new_value: null,
        ip_address: 'local:gerir_contas'
      }
    });
  } catch (e) {
    console.log(L.amarelo + '  (aviso: nao foi possivel registar na auditoria: ' + e.message + ')' + L.reset);
  }

  // Prova final: volta a ler da base de dados para confirmar.
  const guardado = await prisma.user.findUnique({ where: { id: conta.id }, select: { password_hash: true } });
  const final = await bcrypt.compare(senhaNova, guardado.password_hash);

  console.log(L.verde + '  SENHA DE ' + conta.email + ' ALTERADA COM SUCESSO' + L.reset);
  console.log(L.cinzento + '  hash: ' + guardado.password_hash.slice(0, 7) + '... (bcrypt, custo ' + CUSTO_BCRYPT + ')' +
    '  |  motivo: ' + motivo + '  |  verificada na base de dados: ' + (final ? 'SIM' : 'NAO') + L.reset);
}

async function escolherConta(contas) {
  const resposta = await perguntar(L.azul + '  Numero da conta (ou o email): ' + L.reset);
  if (!resposta || resposta === '0') return null;

  const numero = Number(resposta);
  if (Number.isInteger(numero) && numero >= 1 && numero <= contas.length) return contas[numero - 1];

  const email = resposta.toLowerCase();
  return contas.find((c) => c.email.toLowerCase() === email) || null;
}

// ---------------------------------------------------------------------------
// Acoes do menu
// ---------------------------------------------------------------------------
async function acaoVerificar(contas) {
  const conta = await escolherConta(contas);
  if (!conta) { console.log(L.vermelho + '  Conta nao encontrada.' + L.reset); return; }
  const tentativa = await perguntarSecreto(L.azul + '  Senha a testar para ' + conta.email + ': ' + L.reset);
  if (!tentativa) { console.log(L.vermelho + '  Senha vazia — nada a fazer.' + L.reset); return; }
  const ok = await bcrypt.compare(tentativa, conta.password_hash || '');
  console.log(ok
    ? L.verde + '  CORRECTA — essa e a senha desta conta.' + L.reset
    : L.vermelho + '  ERRADA — essa nao e a senha desta conta.' + L.reset);
}

async function acaoDefinir(contas, gerar) {
  const conta = await escolherConta(contas);
  if (!conta) { console.log(L.vermelho + '  Conta nao encontrada.' + L.reset); return; }

  let senha;
  let motivo;
  if (gerar) {
    senha = gerarSenha();
    motivo = 'senha forte gerada';
    console.log(L.amarelo + '  Senha gerada: ' + senha + L.reset);
    const ok = await perguntar('  Aplicar esta senha? (s/N): ');
    if (!/^[sSyY]$/.test(ok)) { console.log(L.cinzento + '  Cancelado.' + L.reset); return; }
  } else {
    senha = await perguntarSecreto(L.azul + '  Nova senha para ' + conta.email + ': ' + L.reset);
    const problemas = avaliarSenha(senha);
    if (problemas.length) {
      console.log(L.vermelho + '  Senha fraca: ' + problemas.join('; ') + L.reset);
      return;
    }
    const repetir = await perguntarSecreto('  Repita a senha: ');
    if (repetir !== senha) {
      console.log(L.vermelho + '  As duas senhas nao sao iguais — nada foi alterado.' + L.reset);
      return;
    }
    motivo = 'senha escolhida a mao';
  }

  console.log(L.amarelo + '  Vai substituir a senha de ' + conta.email + ' (' + conta.role + ').' + L.reset);
  const confirmar = await perguntar('  Confirmar? (s/N): ');
  if (!/^[sSyY]$/.test(confirmar)) { console.log(L.cinzento + '  Cancelado.' + L.reset); return; }

  try {
    await gravarSenha(conta, senha, motivo);
  } catch (e) {
    console.log(L.vermelho + '  FALHOU: ' + e.message + L.reset);
  }
}

async function acaoReporDoEnv(contas) {
  const conta = await escolherConta(contas);
  if (!conta) { console.log(L.vermelho + '  Conta nao encontrada.' + L.reset); return; }

  const candidatos = senhasDoEnv();
  if (!candidatos.length) {
    console.log(L.vermelho + '  O .env nao tem nenhuma DEMO_*_PASSWORD definida.' + L.reset);
    return;
  }
  console.log('  Variaveis disponiveis no .env:');
  candidatos.forEach((s, i) => console.log('    ' + (i + 1) + ') ' + s.variavel + '  (' + s.valor.length + ' caracteres)'));
  const escolha = await perguntar('  Qual usar? (numero): ');
  const s = candidatos[Number(escolha) - 1];
  if (!s) { console.log(L.vermelho + '  Escolha invalida.' + L.reset); return; }

  const confirmar = await perguntar('  Por a senha de ' + s.variavel + ' em ' + conta.email + '? (s/N): ');
  if (!/^[sSyY]$/.test(confirmar)) { console.log(L.cinzento + '  Cancelado.' + L.reset); return; }

  try {
    await gravarSenha(conta, s.valor, 'reposta a partir de ' + s.variavel);
  } catch (e) {
    console.log(L.vermelho + '  FALHOU: ' + e.message + L.reset);
  }
}

async function acaoActivar(contas) {
  const conta = await escolherConta(contas);
  if (!conta) { console.log(L.vermelho + '  Conta nao encontrada.' + L.reset); return; }
  const novo = !conta.is_active;
  const confirmar = await perguntar('  ' + (novo ? 'Activar' : 'Desactivar') + ' ' + conta.email + '? (s/N): ');
  if (!/^[sSyY]$/.test(confirmar)) { console.log(L.cinzento + '  Cancelado.' + L.reset); return; }
  await prisma.user.update({ where: { id: conta.id }, data: { is_active: novo } });
  conta.is_active = novo;
  console.log(L.verde + '  ' + conta.email + ' ficou ' + (novo ? 'ACTIVA' : 'INACTIVA') + '.' + L.reset);
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------
async function menu() {
  console.clear?.();
  titulo('GESTAO DE CONTAS E SENHAS — GENESIS');
  console.log('  ' + L.cinzento + 'As senhas estao em bcrypt (custo ' + CUSTO_BCRYPT + '), um hash de sentido unico.' + L.reset);
  console.log('  ' + L.cinzento + 'Nao da para "ver" uma senha guardada — so verificar se uma senha bate certo' + L.reset);
  console.log('  ' + L.cinzento + 'ou definir uma nova. E o que este script faz.' + L.reset);

  const contas = await listarContas();

  let running = true;
  while (running) {
    titulo('O QUE QUER FAZER?');
    console.log('   1) Verificar se uma senha bate certo numa conta');
    console.log('   2) Definir senha nova (escreve-se uma)');
    console.log('   3) Gerar senha forte e aplicar');
    console.log('   4) Repor a senha do .env (DEMO_*_PASSWORD)');
    console.log('   5) Activar / desactivar conta');
    console.log('   6) Voltar a listar as contas');
    console.log('   7) Descobrir a que conta pertence cada senha do .env (lento)');
    console.log('   0) Sair');
    console.log('');

    const opcao = await perguntar(L.azul + '  Escolha: ' + L.reset);

    if (opcao === '0') {
      running = false;
      console.log('\n  ' + L.cinzento + 'Adeus. Nada foi alterado alem do que confirmaste.' + L.reset);
      break;
    }
    if (opcao === '1') { await acaoVerificar(contas); continue; }
    if (opcao === '2') { await acaoDefinir(contas, false); continue; }
    if (opcao === '3') { await acaoDefinir(contas, true); continue; }
    if (opcao === '4') { await acaoReporDoEnv(contas); continue; }
    if (opcao === '5') { await acaoActivar(contas); continue; }
    if (opcao === '6') { await listarContas(); continue; }
    if (opcao === '7') { await identificarSenhasDoEnv(contas); continue; }

    console.log(L.amarelo + '  Opcao nao reconhecida.' + L.reset);
  }
}

// ---------------------------------------------------------------------------
// Arranque
// ---------------------------------------------------------------------------
(async () => {
  const args = process.argv.slice(2);

  try {
    await prisma.ready();
  } catch (e) {
    console.log(L.vermelho + '  Nao foi possivel ligar a base de dados: ' + e.message + L.reset);
    console.log(L.cinzento + '  Confirma o DATABASE_URL no backend/.env.' + L.reset);
    process.exit(1);
  }

  // --list: só mostra as contas e sai (bom para capturas de ecra / automacao).
  if (args.includes('--list')) {
    const inicio = Date.now();
    await listarContas();
    if (args.includes('--tempo')) {
      console.log(L.cinzento + '  (' + ((Date.now() - inicio) / 1000).toFixed(1) + ' s)' + L.reset);
    }
    await prisma.$disconnect();
    process.exit(0);
  }

  // --verificar <email> <senha>
  const iVerificar = args.indexOf('--verificar');
  if (iVerificar !== -1) {
    const email = args[iVerificar + 1];
    const senha = args[iVerificar + 2];
    const conta = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!conta) { console.log('conta nao encontrada: ' + email); process.exit(2); }
    const ok = await bcrypt.compare(String(senha), conta.password_hash || '');
    console.log((ok ? 'SENHA CORRECTA: ' : 'SENHA ERRADA:   ') + email);
    await prisma.$disconnect();
    process.exit(ok ? 0 : 1);
  }

  // --definir <email> <senha>
  const iDefinir = args.indexOf('--definir');
  if (iDefinir !== -1) {
    const email = String(args[iDefinir + 1] || '').toLowerCase();
    const senha = String(args[iDefinir + 2] || '');
    const problemas = avaliarSenha(senha);
    if (problemas.length) {
      console.log('senha recusada: ' + problemas.join('; '));
      process.exit(3);
    }
    const conta = await prisma.user.findUnique({ where: { email } });
    if (!conta) { console.log('conta nao encontrada: ' + email); process.exit(2); }
    await gravarSenha(conta, senha, 'linha de comando');
    await prisma.$disconnect();
    process.exit(0);
  }

  await menu();
  await prisma.$disconnect();
  process.exit(0);
})().catch((e) => {
  console.log(L.vermelho + '\n  ERRO: ' + e.message + L.reset);
  process.exit(1);
});
