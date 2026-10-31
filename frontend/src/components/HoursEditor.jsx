import React from 'react';
import { Plus, X } from 'lucide-react';
import { useI18n } from '../i18n/react';
import { Button, IconButton, Select, cx } from './ui';

// Horario de funcionamento (31/10/2026; o servidor valida em backend/src/utils/hours.js).
// O fundador: «e se for 24/24h? segunda fecha as 20h, sexta nao fecha, domingo
// fecha as 12h...». Tres maneiras: todos os dias igual, 24 horas, ou dia a dia
// (com pausas e dias fechados), mais feriados. Horas sempre em 24 h: o campo de
// hora do browser mostrava «01:00 AM» em computadores em ingles.
export const DEFAULT_SCHEDULE = { v: 1, mode: 'same', days: { 0: [['08:00', '20:00']], 1: [['08:00', '20:00']], 2: [['08:00', '20:00']], 3: [['08:00', '20:00']], 4: [['08:00', '20:00']], 5: [['08:00', '20:00']], 6: [['08:00', '20:00']] }, day_end: '00:00', exceptions: [] };
const WEEK = [['1', 'Segunda'], ['2', 'Terça'], ['3', 'Quarta'], ['4', 'Quinta'], ['5', 'Sexta'], ['6', 'Sábado'], ['0', 'Domingo']];
const HOURS = Array.from({ length: 24 }, (_, h) => String(h).padStart(2, '0'));
const MINS = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
const mins = (v) => { const [h, m] = v.split(':').map(Number); return h * 60 + m; };
const crosses = ([a, b]) => b !== '24:00' && mins(b) <= mins(a);

// Horario antigo (so abre/fecha) -> o novo.
export function scheduleFrom(hours) {
  if (hours?.schedule) return hours.schedule;
  const o = hours?.opening_time || '08:00'; const c = hours?.closing_time || '20:00';
  return { ...DEFAULT_SCHEDULE, days: Object.fromEntries(Object.keys(DEFAULT_SCHEDULE.days).map((d) => [d, [[o, c]]])) };
}

function TimeField({ label, value, onChange }) {
  const [h, m] = (value === '24:00' ? '00:00' : value).split(':');
  const near = MINS.includes(m) ? m : MINS[Math.round(Number(m) / 5) % 12];
  return (
    <span className="inline-flex items-center gap-1" role="group" aria-label={label}>
      <Select aria-label={label + ' (horas)'} className="w-[4.5rem]" value={h} onChange={(e) => onChange(`${e.target.value}:${near}`)}>
        {HOURS.map((x) => <option key={x} value={x}>{x}</option>)}
      </Select>
      <span className="text-ink-muted">:</span>
      <Select aria-label={label + ' (minutos)'} className="w-[4.5rem]" value={near} onChange={(e) => onChange(`${h}:${e.target.value}`)}>
        {MINS.map((x) => <option key={x} value={x}>{x}</option>)}
      </Select>
    </span>
  );
}

function Intervals({ list, onChange, t }) {
  return (
    <div className="flex flex-col gap-2">
      {list.map((p, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <TimeField label={t('Abre')} value={p[0]} onChange={(v) => onChange(list.map((x, j) => (j === i ? [v, x[1]] : x)))} />
          <span className="text-sm text-ink-muted">{t('até')}</span>
          <TimeField label={t('Fecha')} value={p[1]} onChange={(v) => onChange(list.map((x, j) => (j === i ? [x[0], v] : x)))} />
          {crosses(p) && <span className="text-sm text-ink-muted">{t('(no dia seguinte)')}</span>}
          {list.length > 1 && <IconButton size="sm" icon={X} label={t('Tirar este período')} onClick={() => onChange(list.filter((_, j) => j !== i))} />}
        </div>
      ))}
      {list.length < 4 && (
        <Button size="sm" variant="ghost" icon={Plus} className="self-start" onClick={() => onChange([...list, [list.length ? list[list.length - 1][1] : '14:00', '18:00']])}>{t('Pausa / outro período')}</Button>
      )}
    </div>
  );
}

export default function HoursEditor({ value, onChange }) {
  const { t } = useI18n();
  const s = value || DEFAULT_SCHEDULE;
  const set = (patch) => onChange({ ...s, ...patch });
  const setDay = (d, list) => set({ days: { ...s.days, [d]: list } });
  const sameList = s.days['1']?.length ? s.days['1'] : [['08:00', '20:00']];
  const anyCross = s.mode === '24h' || Object.values(s.days).some((l) => (l || []).some(crosses));

  function setMode(mode) {
    if (mode === 'same') set({ mode, days: Object.fromEntries(Object.keys(DEFAULT_SCHEDULE.days).map((d) => [d, sameList])) });
    else if (mode === '24h') set({ mode, days: Object.fromEntries(Object.keys(DEFAULT_SCHEDULE.days).map((d) => [d, [['00:00', '24:00']]])) });
    else set({ mode, days: s.mode === '24h' ? DEFAULT_SCHEDULE.days : s.days });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Em coluna no telemovel, em linha no PC: os 3 nomes nunca saem do ecra. */}
      <div role="radiogroup" aria-label={t('Horário')} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {[['same', t('Todos os dias igual')], ['24h', t('Aberto 24 horas')], ['custom', t('Horário por dia')]].map(([v, label]) => (
          <button key={v} type="button" role="radio" aria-checked={s.mode === v} onClick={() => setMode(v)}
            className={cx('h-10 rounded border px-3 text-sm font-medium', s.mode === v ? 'border-accent bg-accent-soft text-accent' : 'border-border-strong bg-surface text-ink-2 hover:bg-subtle')}>
            {label}
          </button>
        ))}
      </div>

      {s.mode === 'same' && (
        <Intervals t={t} list={sameList} onChange={(list) => set({ days: Object.fromEntries(Object.keys(DEFAULT_SCHEDULE.days).map((d) => [d, list])) })} />
      )}
      {s.mode === '24h' && <p className="text-base text-ink-2">{t('Aberto todos os dias, a qualquer hora. O balcão nunca fecha o dia sozinho.')}</p>}
      {s.mode === 'custom' && (
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border">
          {WEEK.map(([d, label]) => {
            const list = s.days[d] || [];
            const state = !list.length ? 'closed' : list.some((p) => p[0] === '00:00' && p[1] === '24:00') ? '24h' : 'open';
            return (
              <div key={d} className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start">
                <span className="w-24 shrink-0 pt-2 font-medium text-ink">{t(label)}</span>
                <Select aria-label={t('Como está {d}', { d: t(label) })} className="w-40 shrink-0" value={state}
                  onChange={(e) => setDay(d, e.target.value === 'closed' ? [] : e.target.value === '24h' ? [['00:00', '24:00']] : [['08:00', '20:00']])}>
                  <option value="open">{t('Aberto')}</option>
                  <option value="closed">{t('Fechado')}</option>
                  <option value="24h">{t('24 horas')}</option>
                </Select>
                {state === 'open' && <div className="flex-1"><Intervals t={t} list={list} onChange={(l) => setDay(d, l)} /></div>}
              </div>
            );
          })}
          <div className="px-3 py-2">
            <Button size="sm" variant="ghost" onClick={() => set({ days: Object.fromEntries(Object.keys(DEFAULT_SCHEDULE.days).map((d) => [d, s.days['1'] || []])) })}>{t('Copiar a segunda-feira para todos os dias')}</Button>
          </div>
        </div>
      )}

      {anyCross && (
        <div className="rounded-lg border border-border bg-subtle px-3 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base text-ink">{t('O dia de vendas acaba às')}</span>
            <TimeField label={t('Fim do dia de vendas')} value={s.day_end || '00:00'} onChange={(v) => set({ day_end: v })} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">{t('As vendas depois da meia-noite contam para o dia em que abriu. Ex.: aberto das 18h às 4h, uma venda à 1h de sábado conta para sexta.')}</p>
        </div>
      )}

      <Exceptions t={t} list={s.exceptions || []} onChange={(exceptions) => set({ exceptions })} />
    </div>
  );
}

function Exceptions({ list, onChange, t }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink">{t('Feriados e dias especiais')}</p>
      {list.length === 0 && <p className="text-sm text-ink-muted">{t('Nenhum. Ex.: 25 de Dezembro fechado, ou 24 de Dezembro só de manhã.')}</p>}
      {list.map((x, i) => (
        <div key={i} className={cx('flex flex-wrap items-center gap-2')}>
          <input type="date" aria-label={t('Data')} className="h-9 rounded border border-border-strong bg-surface px-2 text-base text-ink" value={x.date}
            onChange={(e) => onChange(list.map((y, j) => (j === i ? { ...y, date: e.target.value } : y)))} />
          <Select aria-label={t('Como está nesse dia')} className="w-36" value={x.closed ? 'closed' : 'open'}
            onChange={(e) => onChange(list.map((y, j) => (j === i ? (e.target.value === 'closed' ? { date: y.date, closed: true } : { date: y.date, intervals: [['08:00', '13:00']] }) : y)))}>
            <option value="closed">{t('Fechado')}</option>
            <option value="open">{t('Horário especial')}</option>
          </Select>
          {!x.closed && <Intervals t={t} list={x.intervals || [['08:00', '13:00']]} onChange={(l) => onChange(list.map((y, j) => (j === i ? { date: y.date, intervals: l } : y)))} />}
          <IconButton size="sm" icon={X} label={t('Tirar este dia')} onClick={() => onChange(list.filter((_, j) => j !== i))} />
        </div>
      ))}
      <Button size="sm" variant="ghost" icon={Plus} className="self-start" onClick={() => onChange([...list, { date: new Date(Date.now() + 2 * 3600000).toISOString().slice(0, 10), closed: true }])}>{t('Acrescentar dia')}</Button>
    </div>
  );
}
