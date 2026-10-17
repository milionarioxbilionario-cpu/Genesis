import React, { useState } from 'react';
import { Bluetooth, Cable, Camera, Printer, ScanBarcode } from 'lucide-react';
import { capabilities, connectBluetoothPrinter, connectUsbPrinter, getDevicePrefs, markAsked, setDevicePrefs } from '../../utils/devices';
import { Alert, Button, Dialog, Input, LanguageSwitch, Segmented } from '../../components/ui';
import { saveLanguage } from '../../utils/api';
import { useI18n } from '../../i18n/react';

// Leitor de codigo de barras e impressora de recibos (Fase 8.8, pedido do
// fundador 10/10/2026): perguntado logo depois do PIN, uma vez por caixista
// neste aparelho, com "Não tenho" para saltar; depois muda-se no botao
// «Dispositivos» do terminal. O recibo fica SEMPRE em PDF no aparelho, haja ou
// nao impressora (decisao 11/10).
// Fechar no X (9.5, decisao do fundador 17/10): fecha sem mudar nada. Antes
// fazia o mesmo que «Não tenho — saltar» e quem abria só para ver perdia a
// impressora ligada. Só «Não tenho — saltar» põe «Só PDF».
export default function DevicesDialog({ cashier, onClose }) {
  const { t } = useI18n();
  const caps = capabilities();
  const start = getDevicePrefs();
  const [scanner, setScanner] = useState(start.scanner === 'camera' && !caps.camera ? 'usb' : start.scanner);
  const [printer, setPrinter] = useState(start.printer);
  const [printerName, setPrinterName] = useState(start.printerName);
  const [test, setTest] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);

  const scannerOptions = [{ value: 'usb', label: t('Leitor') }, ...(caps.camera ? [{ value: 'camera', label: t('Câmara') }] : []), { value: 'none', label: t('Não uso') }];
  const printerOptions = [
    ...(caps.usb ? [{ value: 'usb', label: 'USB' }] : []),
    ...(caps.bluetooth ? [{ value: 'bluetooth', label: 'Bluetooth' }] : []),
    ...(caps.desktop ? [{ value: 'system', label: t('Do computador') }] : []),
    { value: 'none', label: t('Só PDF') },
  ];

  async function connect(kind) {
    setBusy(kind); setMsg(null);
    try {
      if (kind === 'usb') { await connectUsbPrinter(); setPrinterName('USB'); setMsg({ tone: 'positive', text: t('Impressora USB ligada. Os recibos passam a sair nela sem perguntar.') }); }
      else { const name = await connectBluetoothPrinter(); setPrinterName(name); setMsg({ tone: 'positive', text: t('Impressora «{name}» ligada.', { name }) }); }
    } catch (err) {
      if (err?.name === 'NotFoundError' || err?.name === 'AbortError') setMsg({ tone: 'warning', text: t('Nenhuma impressora escolhida.') });
      else setMsg({ tone: 'danger', text: err?.message || t('Não foi possível ligar a impressora.') });
    } finally { setBusy(''); }
  }

  // X: fecha sem mexer nas escolhas guardadas (conta como perguntado, para não
  // voltar a abrir sozinho no próximo PIN).
  function dismiss() {
    if (cashier?.id) markAsked(cashier.id);
    onClose?.();
  }

  function finish(save) {
    if (save) setDevicePrefs({ scanner, printer, printerName });
    else setDevicePrefs({ printer: 'none' }); // "Não tenho": só o PDF, sem janelas de impressão
    if (cashier?.id) markAsked(cashier.id);
    onClose?.();
  }

  return (
    <Dialog open title={t('Dispositivos')} description={t('Leitor de código de barras e impressora de recibos deste aparelho. Só pergunta uma vez; depois muda no botão «Dispositivos».')}
      onClose={dismiss}
      footer={<><Button onClick={() => finish(false)}>{t('Não tenho — saltar')}</Button><Button variant="primary" onClick={() => finish(true)}>{t('Continuar')}</Button></>}>
      <div className="flex flex-col gap-5">
        {/* Lingua do caixista (9.3): grava logo na conta dele, sem esperar por «Continuar». */}
        <section className="flex flex-col gap-2">
          <h3 className="font-medium text-ink">{t('A sua língua')}</h3>
          <LanguageSwitch remember={false} onChange={saveLanguage} />
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 font-medium text-ink"><ScanBarcode size={17} /> {t('Leitor de código de barras')}</h3>
          <Segmented className="w-full" value={scanner} onChange={setScanner} options={scannerOptions} />
          {scanner === 'usb' && (
            <>
              <p className="text-sm text-ink-muted">{t('Ligue o leitor (cabo USB ou Bluetooth do aparelho): funciona como teclado e o código vai para a pesquisa do terminal.')}</p>
              <Input label={t('Teste: leia um código aqui')} value={test} onChange={(e) => setTest(e.target.value)} inputClassName="num" />
              {test.trim().length >= 6 && <p className="text-sm text-positive">{t('Leitor a funcionar: {code}', { code: test.trim() })}</p>}
            </>
          )}
          {scanner === 'camera' && <p className="flex items-center gap-2 text-sm text-ink-muted"><Camera size={15} /> {t('No terminal, toque no botão da câmara ao lado da pesquisa e aponte para o código.')}</p>}
        </section>
        <section className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 font-medium text-ink"><Printer size={17} /> {t('Impressora de recibos')}</h3>
          <Segmented className="w-full" value={printer} onChange={(v) => { setPrinter(v); setMsg(null); }} options={printerOptions} />
          {printer === 'usb' && <Button icon={Cable} loading={busy === 'usb'} onClick={() => connect('usb')}>{printerName ? t('Ligar outra impressora USB') : t('Ligar impressora USB')}</Button>}
          {printer === 'bluetooth' && (
            <>
              <Button icon={Bluetooth} loading={busy === 'bluetooth'} onClick={() => connect('bluetooth')}>{printerName ? t('Procurar outra impressora') : t('Procurar impressora Bluetooth')}</Button>
              <p className="text-sm text-ink-muted">{t('Ligue a impressora e o Bluetooth do aparelho. Funciona com impressoras Bluetooth BLE; as que só têm Bluetooth «clássico» não são acessíveis pelo browser.')}</p>
            </>
          )}
          {printer === 'system' && <p className="text-sm text-ink-muted">{t('Abre a janela de impressão do computador (impressora instalada no Windows).')}</p>}
          {!caps.usb && !caps.bluetooth && <p className="text-sm text-ink-muted">{t('Este aparelho não liga impressoras pelo browser (por exemplo, o iPhone). O recibo sai em PDF para partilhar com a app da impressora.')}</p>}
          <p className="text-sm text-ink-2">{t('O recibo fica sempre guardado em PDF neste aparelho, com ou sem impressora.')}</p>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        </section>
      </div>
    </Dialog>
  );
}
