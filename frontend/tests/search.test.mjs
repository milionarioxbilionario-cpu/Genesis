// Pesquisa sem acentos (Fase 7.2). Correr: node --test tests/search.test.mjs  (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { foldText, nameMatches } from '../src/utils/search.js';

test('sem acentos encontra o nome com acentos', () => {
  assert.equal(nameMatches('Açúcar Branco 1kg', foldText('acucar')), true);
  assert.equal(nameMatches('Pão de Forma', foldText('pao')), true);
  assert.equal(nameMatches('Feijão Manteiga', foldText('FEIJAO')), true);
});

test('com acentos encontra o nome sem acentos e vice-versa', () => {
  assert.equal(nameMatches('Acucar', foldText('açúcar')), true);
  assert.equal(nameMatches('Água Mineral 500ml', foldText('  Água ')), true);
});

test('nao encontra o que nao esta no nome; pesquisa vazia mostra tudo', () => {
  assert.equal(nameMatches('Açúcar', foldText('arroz')), false);
  assert.equal(nameMatches('Açúcar', foldText('')), true);
});

test('foldText trata nulos e o ç maiusculo', () => {
  assert.equal(foldText(null), '');
  assert.equal(foldText('ÇÃO'), 'cao');
});
