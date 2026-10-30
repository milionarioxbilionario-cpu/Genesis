// Etapa C: coordenadas a partir de links do Google Maps. Correr: node --test tests/geo.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseLocation, mapsLinkKind } = require('../src/utils/geo');

test('links longos do Google Maps (marcador, centro, q=)', () => {
  assert.deepEqual(parseLocation('https://www.google.com/maps/place/Polana/@-25.9692,32.5995,17z/data=!3m1!4b1!4m6!3m5!1s0x0:0x0!8m2!3d-25.969512!4d32.601144'), { lat: -25.969512, lng: 32.601144 });
  assert.deepEqual(parseLocation('https://www.google.com/maps/@-25.9655,32.5832,15z'), { lat: -25.9655, lng: 32.5832 });
  assert.deepEqual(parseLocation('https://maps.google.com/?q=-25.9655,32.5832'), { lat: -25.9655, lng: 32.5832 });
  assert.deepEqual(parseLocation('https://www.google.com/maps/search/?api=1&query=-19.8436%2C34.8389'), { lat: -19.8436, lng: 34.8389 });
});

test('coordenadas escritas a mao', () => {
  assert.deepEqual(parseLocation('-25.96553, 32.58322'), { lat: -25.96553, lng: 32.58322 });
  assert.deepEqual(parseLocation(' -15.1165;39.2666 '), { lat: -15.1165, lng: 39.2666 });
});

test('o que nao e localizacao e recusado', () => {
  assert.equal(parseLocation('Polana, Maputo'), null);
  assert.equal(parseLocation('0,0'), null, '0,0 e o mar ao largo de Africa: nunca e uma loja');
  assert.equal(parseLocation('-95, 32'), null);
  assert.equal(parseLocation(''), null);
});

test('so links do Google Maps podem ser abertos pelo servidor', () => {
  assert.equal(mapsLinkKind('https://maps.app.goo.gl/AbC123'), 'short');
  assert.equal(mapsLinkKind('https://www.google.com/maps/place/x'), 'long');
  assert.equal(mapsLinkKind('https://google.co.mz/maps/@-25,32,10z'), 'long');
  assert.equal(mapsLinkKind('http://maps.app.goo.gl/AbC123'), null, 'so https');
  assert.equal(mapsLinkKind('https://evil.example/maps'), null);
  assert.equal(mapsLinkKind('https://google.com.evil.example/maps'), null);
  assert.equal(mapsLinkKind('https://127.0.0.1/maps'), null);
});
