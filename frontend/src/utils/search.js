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

// Pesquisa nas duas linguas (Fase 9.8, decisao do fundador 12/10): "water"
// encontra "Água Namaacha". So os produtos vindos do catalogo-mestre tem
// name_en (o servidor junta-o pelo nome); os criados pelo dono procuram-se
// como ele os escreveu. Vale em qualquer lingua do ecra.
export function productMatches(product, query) {
  return nameMatches(product?.name, query) || Boolean(product?.name_en && foldText(product.name_en).includes(query));
}
