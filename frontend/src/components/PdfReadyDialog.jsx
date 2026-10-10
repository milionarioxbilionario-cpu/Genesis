import React from 'react';
import { Share2 } from 'lucide-react';
import { downloadBlob, sharePdf } from '../utils/pdf/deliver';
import { Button, Dialog } from './ui';

// O PDF ficou pronto mas o iPhone recusou abrir a partilha sem um toque novo
// (gerar demorou). Um toque aqui abre a folha de partilha.
export default function PdfReadyDialog({ file, onClose }) {
  if (!file) return null;
  async function share() {
    try {
      const res = await sharePdf(file);
      if (res.needsTap) downloadBlob(file, file.name);
    } catch (_) {
      downloadBlob(file, file.name);
    }
    onClose();
  }
  return (
    <Dialog
      open
      size="sm"
      title="PDF pronto"
      description={file.name}
      onClose={onClose}
      footer={<><Button onClick={onClose}>Fechar</Button><Button variant="primary" icon={Share2} onClick={share} autoFocus>Partilhar / imprimir</Button></>}
    >
      <p className="text-base text-ink-2">Toque em «Partilhar / imprimir» para imprimir, guardar em Ficheiros ou enviar por WhatsApp.</p>
    </Dialog>
  );
}
