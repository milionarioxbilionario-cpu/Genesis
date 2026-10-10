// Texto para o PDF. As fontes base do jsPDF so tem Latin-1: o "−" do money(),
// os espacos finos do Intl (12 000,00) ou um emoji num nome de produto saiam
// como lixo. Tudo o que entra no PDF passa por aqui.
const MAP = { '−': '-', '–': '-', '—': '-', '→': '->', '…': '...', '‘': "'", '’': "'", '“': '"', '”': '"', '•': '·', ' ': ' ', ' ': ' ', ' ': ' ' };

export function pdfText(value) {
  return String(value ?? '')
    .replace(/[−–—→…‘’“”•   ]/g, (c) => MAP[c])
    .replace(/[^\x00-\xFF]/gu, '');
}

// Nome de ficheiro valido no Windows, iPhone e Android.
export function safeFileName(value) {
  return String(value ?? '').replace(/[\\/:*?"<>|\u0000-\u001F]/g, '').replace(/\s+/g, ' ').trim() || 'Genesis';
}

const p2 = (n) => String(n).padStart(2, '0');
export const dmy = (d) => `${p2(d.getDate())}-${p2(d.getMonth() + 1)}-${d.getFullYear()}`;
export const hms = (d) => `${p2(d.getHours())}-${p2(d.getMinutes())}-${p2(d.getSeconds())}`;
// "AAAA-MM-DD" -> "DD-MM-AAAA"
export const isoToDmy = (iso) => String(iso).slice(0, 10).split('-').reverse().join('-');
