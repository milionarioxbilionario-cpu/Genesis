import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Dialog } from './ui';
import { t as tr } from '../i18n/core';
import { useI18n } from '../i18n/react';

// Leitura de codigo de barras pela camara do telemovel (Fase 8.8, pedido do
// fundador 10/10/2026). O Safari do iPhone nao tem BarcodeDetector, por isso
// usa-se o ZXing (JavaScript), carregado so quando a camara abre.
//  - continuous: le uns atras dos outros (terminal: cada codigo conhecido entra
//    logo no carrinho); o mesmo codigo so volta a contar passados 1,5 s.
//  - sem continuous: le um codigo e fecha (formulario do produto).
// onCode(code) devolve { ok, message } para o aviso no ecra.
const REPEAT_MS = 1500;

// qr: tambem le QR (Etapa B, terminal do guarda: o QR do recibo).
async function loadReader(qr = false) {
  const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([import('@zxing/browser'), import('@zxing/library')]);
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, ...(qr ? [BarcodeFormat.QR_CODE] : [])]);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
}

function cameraError(err) {
  if (!window.isSecureContext) return tr('A câmara só funciona com ligação segura (https).');
  if (err?.name === 'NotAllowedError') return tr('Sem autorização para usar a câmara. Autorize a câmara nas definições do browser e tente de novo.');
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return tr('Este aparelho não tem câmara disponível.');
  if (err?.name === 'NotReadableError') return tr('A câmara está a ser usada por outra aplicação.');
  return tr('Não foi possível abrir a câmara.');
}

export default function BarcodeScanner({ open, onClose, onCode, continuous = false, title, qr = false }) {
  const { t } = useI18n();
  const video = useRef(null);
  const controls = useRef(null);
  const last = useRef({ code: '', at: 0 });
  const handler = useRef(onCode);
  handler.current = onCode;
  const [status, setStatus] = useState({ text: tr('A abrir a câmara…'), tone: 'neutral' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setError(''); setStatus({ text: tr('A abrir a câmara…'), tone: 'neutral' });
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('sem camara'), { name: 'NotFoundError' });
        const reader = await loadReader(qr);
        if (cancelled) return;
        controls.current = await reader.decodeFromConstraints({ audio: false, video: { facingMode: { ideal: 'environment' } } }, video.current, (result) => {
          if (!result || cancelled) return;
          const code = result.getText().trim();
          const now = Date.now();
          if (code === last.current.code && now - last.current.at < REPEAT_MS) return;
          last.current = { code, at: now };
          const res = handler.current?.(code) || { ok: true, message: code };
          setStatus({ text: res.message, tone: res.ok ? 'positive' : 'danger' });
          try { navigator.vibrate?.(res.ok ? 60 : [40, 60, 40]); } catch { /* sem vibracao */ }
          if (!continuous && res.ok) { controls.current?.stop(); onClose?.(); }
        });
        if (cancelled) { controls.current?.stop(); return; }
        setStatus({ text: tr('Aponte para o código de barras.'), tone: 'neutral' });
      } catch (err) {
        if (!cancelled) setError(cameraError(err));
      }
    })();
    return () => { cancelled = true; try { controls.current?.stop(); } catch { /* ja parada */ } controls.current = null; };
  }, [open, continuous]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const toneClass = status.tone === 'positive' ? 'text-positive' : status.tone === 'danger' ? 'text-danger' : 'text-ink-2';
  return (
    <Dialog open title={title || t('Ler código de barras')} description={continuous ? t('Cada produto lido entra logo na venda.') : t('O código lido fica no produto.')} onClose={onClose}
      footer={<Button variant="primary" onClick={onClose}>{continuous ? t('Concluir') : t('Fechar')}</Button>}>
      {error ? <Alert tone="danger">{error}</Alert> : (
        <div className="flex flex-col gap-3">
          <div className="relative overflow-hidden rounded-lg bg-ink">
            <video ref={video} muted playsInline className="aspect-[4/3] w-full object-cover" data-testid="camera-video" />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-[rgba(239,68,68,0.8)]" />
          </div>
          <p role="status" aria-live="polite" className={'text-center font-medium ' + toneClass}>{status.text}</p>
        </div>
      )}
    </Dialog>
  );
}
