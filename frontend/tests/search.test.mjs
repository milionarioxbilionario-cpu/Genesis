// Pesquisa sem acentos (Fase 7.2). Correr: node --test tests/search.test.mjs  (dentro de frontend/)
import test from 'node:test';
import assert from 'node:assert/strict';
import { foldText, nameMatches, productMatches } from '../src/utils/search.js';

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

test('9.8: pesquisa nas duas linguas (so produtos com name_en)', () => {
  const agua = { name: 'Água Namaacha 1,5L', name_en: 'Namaacha Water 1.5L' };
  const doDono = { name: 'Sumo da casa', name_en: null };
  assert.ok(productMatches(agua, foldText('water')), '"water" encontra "Água"');
  assert.ok(productMatches(agua, foldText('agua')), 'o portugues continua');
  assert.ok(productMatches(agua, foldText('WATER 1.5')), 'sem maiusculas');
  assert.ok(!productMatches(agua, foldText('beer')));
  assert.ok(productMatches(doDono, foldText('sumo')) && !productMatches(doDono, foldText('juice')), 'produto do dono: so pelo nome dele');
  assert.ok(productMatches({ name: 'X' }, ''), 'pesquisa vazia: tudo');
});
