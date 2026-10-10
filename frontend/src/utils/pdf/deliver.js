// Entrega de um PDF gerado no browser.
//
// Telemovel/tablet (e a app no ecra principal do iPhone): folha de partilha do
// sistema — dai o dono imprime (AirPrint), guarda em Ficheiros ou envia por
// WhatsApp. window.print() e window.open() nao servem ai: na app do ecra
// principal o print nao faz nada e a janela nova abre sem botao de voltar,
// prendendo o utilizador (teste do fundador, 10/10/2026).
// Computador: descarrega o ficheiro.

export function prefersShare() {
  if (typeof window === 'undefined') return false;
  const standalone = window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;
  const touch = window.matchMedia?.('(pointer: coarse)').matches;
  return Boolean(standalone || touch);
}

export function pdfFile(blob, filename) {
  return new File([blob], filename, { type: 'application/pdf' });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

// A partilha exige um toque "fresco": se gerar o PDF demorou (rede, primeira
// carga do gerador) o Safari recusa com NotAllowedError. Nesse caso devolve
// { needsTap: true, file } e o ecra mostra um botao para partilhar com novo toque.
export async function sharePdf(file) {
  try {
    await navigator.share({ files: [file], title: file.name.replace(/\.pdf$/i, '') });
    return { ok: true, via: 'share' };
  } catch (err) {
    if (err?.name === 'AbortError') return { ok: true, via: 'cancelled' };
    if (err?.name === 'NotAllowedError') return { ok: false, needsTap: true, file };
    throw err;
  }
}

export async function deliverPdf(blob, filename) {
  const file = pdfFile(blob, filename);
  if (prefersShare() && navigator.canShare?.({ files: [file] })) return sharePdf(file);
  downloadBlob(blob, filename);
  return { ok: true, via: 'download' };
}
