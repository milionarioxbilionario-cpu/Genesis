// Pesquisa de produtos sem acentos nem maiusculas: "acucar" encontra "Açúcar",
// "pao" encontra "Pão". Quem escreve no balcao raramente poe acentos.
// NFD separa a letra do acento (ç -> c + ¸) e os acentos sao removidos.
export function foldText(value) {
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// `query` ja dobrado (foldText) — o filtro corre por cada produto.
export function nameMatches(name, query) {
  return !query || foldText(name).includes(query);
}
