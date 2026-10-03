// Sessoes com ambito restrito (Genesis 2.0) — listas FECHADAS de rotas.
// Aplicadas pelo authMiddleware, mesmo que a rota em si deixasse passar.
//
//  - 'pos': sessao de caixista aberta num terminal emparelhado (PIN). So as
//    rotas do POS. Defesa em profundidade: o papel cashier ja e limitado pelo
//    requireRole, mas uma rota futura com requireRole('owner','cashier') mal
//    pensada nao fica automaticamente exposta ao balcao.
//  - 'support': o Super Admin a ver uma loja em modo suporte. SO LEITURA (a
//    especificacao 4.1 diz "vista de leitura/suporte", nao um login como o dono).
//
// Regra para quem mexer aqui: acrescentar uma rota a lista 'pos' da-a a quem
// estiver sentado no balcao.
const SCOPES = {
  pos: [
    ['GET', /^\/api\/auth\/me\/?$/],
    ['GET', /^\/api\/products\/?$/],
    ['GET', /^\/api\/sales\/?$/],
    ['POST', /^\/api\/sales\/?$/],
    ['GET', /^\/api\/sales\/cancel-pin-status\/?$/],
    ['POST', /^\/api\/sales\/[^/]+\/cancel\/?$/], // exige o PIN do dono
    ['POST', /^\/api\/demand_captures\/?$/],
    ['POST', /^\/api\/shrinkage_records\/?$/],
    ['GET', /^\/api\/pos\/shift\/?$/],
    ['POST', /^\/api\/pos\/shift\/close\/?$/],
  ],
  support: [
    ['GET', /^\/api\/auth\/me\/?$/],
    ['GET', /^\/api\/(owner|products|inventory|dashboard|settings|sales)(\/.*)?$/],
  ],
};

function isScopeAllowed(scope, method, originalUrl) {
  const rules = SCOPES[scope];
  if (!rules) return false; // scope desconhecido: fechado por omissao
  const path = String(originalUrl || '').split('?')[0];
  const m = String(method || '').toUpperCase();
  return rules.some(([allowed, re]) => allowed === m && re.test(path));
}

module.exports = { isScopeAllowed, SCOPES };
