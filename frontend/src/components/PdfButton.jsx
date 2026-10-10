import React, { useEffect, useState } from 'react';
import { FileDown } from 'lucide-react';
import { deliverPdf } from '../utils/pdf/deliver';
import PdfReadyDialog from './PdfReadyDialog';
import { Button, useToast } from './ui';

// Botao "PDF / imprimir": build() devolve { blob, filename }. No telemovel abre
// a folha de partilha (imprimir, guardar, WhatsApp); no computador descarrega.
// preload() carrega o gerador antes do toque (o iPhone so partilha com um
// toque "fresco").
export default function PdfButton({ build, preload, disabled, label = 'PDF / imprimir' }) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);
  const toast = useToast();
  useEffect(() => { preload?.().catch(() => {}); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function run() {
    setBusy(true);
    try {
      const { blob, filename } = await build();
      const res = await deliverPdf(blob, filename);
      if (res.needsTap) setFile(res.file);
    } catch (err) {
      console.error('PDF falhou', err);
      toast('Não foi possível gerar o PDF. Tente de novo.', 'danger');
    } finally { setBusy(false); }
  }
  return (
    <>
      <Button className="no-print" size="sm" icon={FileDown} loading={busy} disabled={disabled} onClick={run}>{label}</Button>
      <PdfReadyDialog file={file} onClose={() => setFile(null)} />
    </>
  );
}
