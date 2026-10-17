import React from 'react';
import { Languages } from 'lucide-react';
import { cx } from './cx';
import { Button } from './Button';
import { Segmented } from './Form';
import { useI18n } from '../../i18n/react';

// PT | EN (especificacao 6.10: "alternavel no menu"). Muda o ecra logo;
// onChange(lang) guarda a escolha na conta de quem esta a usar (se houver).
// remember=false: nao mexe na lingua guardada do aparelho (terminal partilhado).
// compact: um so botao que alterna (cabecalho cheio do terminal no telemovel).
export function LanguageSwitch({ onChange, remember = true, compact = false, className }) {
  const { lang, setLang, t } = useI18n();
  const choose = (l) => { if (l === lang) return; setLang(l, { remember }); onChange?.(l); };
  if (compact) {
    const next = lang === 'pt' ? 'en' : 'pt';
    return (
      // No telemovel so o texto (o cabecalho do terminal ja esta cheio).
      <Button size="sm" variant="ghost" className={className} aria-label={t('Língua') + ': ' + lang.toUpperCase()} onClick={() => choose(next)}>
        <Languages size={14} strokeWidth={2} className="hidden sm:block" aria-hidden="true" />
        {lang.toUpperCase()}
      </Button>
    );
  }
  return (
    <div role="group" aria-label={t('Língua')} className={cx('flex items-center gap-2', className)}>
      <Languages size={16} strokeWidth={1.8} className="shrink-0 text-ink-muted" aria-hidden="true" />
      <Segmented
        size="sm"
        value={lang}
        options={[{ value: 'pt', label: 'PT' }, { value: 'en', label: 'EN' }]}
        onChange={choose}
      />
    </div>
  );
}
