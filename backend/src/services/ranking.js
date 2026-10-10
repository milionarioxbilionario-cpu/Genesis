// Ranking por niveis dos relatorios ("mais vendidos" e "mais rentaveis").
//
// Regra do fundador (10/10/2026): produtos com o mesmo valor partilham o lugar;
// mostram-se ate 3 niveis e nunca o nivel mais baixo, excepto quando so ha um
// nivel. Ex.: 10, 9, 8, 2, 1 -> 10, 9, 8; 2, 2, 1, 1, 1 -> so os de 2;
// todos com 1 -> todos. Antes ordenava e cortava em 10, por isso uma loja com
// 5 produtos vendidos via os 5 nas duas listas.
//
// So entram valores positivos: um produto vendido com prejuizo nao e
// "rentavel".
function rankByTiers(items, key, { levels = 3 } = {}) {
  const positive = items.filter((i) => Number(i[key]) > 0);
  const values = [...new Set(positive.map((i) => i[key]))].sort((a, b) => b - a);
  const kept = (values.length > 1 ? values.slice(0, -1) : values).slice(0, levels);
  const rankOf = new Map(kept.map((v, idx) => [v, idx + 1]));
  return positive
    .filter((i) => rankOf.has(i[key]))
    .map((i) => ({ ...i, rank: rankOf.get(i[key]) }))
    .sort((a, b) => a.rank - b.rank || String(a.name).localeCompare(String(b.name), 'pt'));
}

module.exports = { rankByTiers };
