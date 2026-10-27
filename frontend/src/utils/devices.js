// Dispositivos do aparelho (Fase 8.8, pedido do fundador 10/10/2026): leitor de
// codigo de barras e impressora de recibos, escolhidos UMA vez por caixista
// neste aparelho (pergunta logo depois do PIN, com "Não tenho" para saltar) e
// mudados depois no botao «Dispositivos» do terminal.
//  - Impressora USB: Web Serial (Chrome/Edge no computador). O browser lembra a
//    autorizacao: depois da 1.a vez imprime sem perguntar (getPorts).
//  - Impressora Bluetooth: Web Bluetooth (Chrome no Android/computador), so
//    impressoras BLE. O Bluetooth "classico" (SPP) e o iPhone nao tem acesso.
//  - Sem impressora: o recibo fica sempre em PDF no aparelho (decisao 11/10).
// Nada disto vai para o servidor: e do aparelho, nao da loja.
import { prefersShare } from './pdf/deliver';
import { t } from '../i18n/core.js';
import { DRAWER_PULSE } from './escpos.js';

const PREFS_KEY = 'genesis_devices';
const ASKED_KEY = 'genesis_devices_asked';
const BT_KEY = 'genesis_bt_printer';

const read = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v ?? fb; } catch { return fb; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* modo privado */ } };

export function capabilities() {
  const nav = typeof navigator === 'undefined' ? {} : navigator;
  return {
    usb: 'serial' in nav,
    bluetooth: 'bluetooth' in nav,
    camera: Boolean(nav.mediaDevices?.getUserMedia),
    desktop: !prefersShare(),
  };
}

// printer: 'usb' | 'bluetooth' | 'system' (janela de impressao do computador) | 'none'
// scanner: 'usb' | 'camera' | 'none'
export function getDevicePrefs() {
  const p = read(PREFS_KEY, {});
  // drawer (Fase 15.1): abrir a gaveta ligada a impressora termica ao cobrar em dinheiro.
  return { printer: p.printer || (capabilities().desktop ? 'system' : 'none'), scanner: p.scanner || (capabilities().desktop ? 'usb' : 'camera'), printerName: p.printerName || '', drawer: p.drawer !== false };
}
export function setDevicePrefs(p) { write(PREFS_KEY, { ...read(PREFS_KEY, {}), ...p }); }

export const wasAsked = (cashierId) => read(ASKED_KEY, []).includes(cashierId);
export function markAsked(cashierId) { const l = read(ASKED_KEY, []); if (!l.includes(cashierId)) write(ASKED_KEY, [...l, cashierId].slice(-50)); }

// ---------------------------------------------------------------- USB
export async function connectUsbPrinter() {
  const port = await navigator.serial.requestPort();
  const info = port.getInfo?.() || {};
  setDevicePrefs({ printer: 'usb', printerName: info.usbProductId ? `USB ${info.usbVendorId?.toString(16)}:${info.usbProductId.toString(16)}` : 'USB' });
  return true;
}
async function writeUsb(bytes) {
  const [port] = await navigator.serial.getPorts();
  if (!port) throw new Error(t('A impressora USB não está ligada. Ligue-a em «Dispositivos».'));
  try { await port.open({ baudRate: 9600 }); } catch (err) { if (err?.name !== 'InvalidStateError') throw err; }
  const writer = port.writable.getWriter();
  try { await writer.write(bytes); } finally { writer.releaseLock(); await port.close().catch(() => {}); }
}

// ---------------------------------------------------------------- Bluetooth
// Servicos habituais das impressoras termicas BLE baratas.
export const BT_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000ff00-0000-1000-8000-00805f9b34fb',
];
export const BT_CHUNK = 180;
let bt = null; // { device, characteristic } durante a sessao

async function findWritable(server) {
  for (const uuid of BT_SERVICES) {
    try {
      const service = await server.getPrimaryService(uuid);
      const chars = await service.getCharacteristics();
      const c = chars.find((x) => x.properties.writeWithoutResponse || x.properties.write);
      if (c) return c;
    } catch { /* este servico nao existe nesta impressora */ }
  }
  throw new Error(t('Esta impressora Bluetooth não aceita recibos (não encontrei por onde escrever).'));
}
async function attach(device) {
  const server = device.gatt.connected ? device.gatt : await device.gatt.connect();
  bt = { device, characteristic: await findWritable(server) };
  return bt;
}
export async function connectBluetoothPrinter() {
  const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: BT_SERVICES });
  await attach(device);
  write(BT_KEY, { id: device.id, name: device.name || '' });
  setDevicePrefs({ printer: 'bluetooth', printerName: device.name || 'Bluetooth' });
  return device.name || 'Bluetooth';
}
async function bluetoothReady() {
  if (bt?.device?.gatt?.connected) return bt;
  if (bt?.device) return attach(bt.device);
  const saved = read(BT_KEY, null);
  if (saved && navigator.bluetooth?.getDevices) {
    const device = (await navigator.bluetooth.getDevices()).find((d) => d.id === saved.id);
    if (device) return attach(device);
  }
  throw new Error(t('A impressora Bluetooth não está ligada. Ligue-a em «Dispositivos».'));
}
async function writeBluetooth(bytes) {
  const { characteristic: c } = await bluetoothReady();
  for (let i = 0; i < bytes.length; i += BT_CHUNK) {
    const part = bytes.slice(i, i + BT_CHUNK);
    if (c.properties.writeWithoutResponse && c.writeValueWithoutResponse) await c.writeValueWithoutResponse(part);
    else await c.writeValue(part);
  }
}

// Envia bytes ESC/POS para a impressora escolhida neste aparelho.
// Fase 15.1: abre a gaveta (so com impressora termica USB/Bluetooth e a opcao ligada). Nunca falha a venda.
export async function openCashDrawer() {
  const { printer, drawer } = getDevicePrefs();
  if (!drawer || (printer !== 'usb' && printer !== 'bluetooth')) return false;
  try { await sendToPrinter(new Uint8Array(DRAWER_PULSE), printer); return true; } catch { return false; }
}

export async function sendToPrinter(bytes, printer = getDevicePrefs().printer) {
  if (printer === 'usb') { await writeUsb(bytes); return 'usb'; }
  if (printer === 'bluetooth') { await writeBluetooth(bytes); return 'bluetooth'; }
  return null;
}
