// ============================================================================
//  Idiomas do Genesis (PT / EN)
//
//  O i18next já vinha instalado mas NUNCA foi ligado — por isso o botão EN do
//  login não fazia nada: era um botão decorativo sem estado por detrás.
//
//  Como usar num ecrã:
//     import { useLang } from '../i18n';
//     const { t, lang, setLang } = useLang();
//     <h1>{t('login.title')}</h1>
//
//  Regras:
//  - A chave é sempre em Inglês (fonte), a string PT é a nossa realidade.
//  - Nunca deixar uma chave por traduzir: se falta EN, o i18next devolve a
//    chave visível, o que é melhor do que mostrar texto em branco — mas o
//    teste scripts/check_i18n.js apanha esses casos.
// ============================================================================
import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';

const STORAGE_KEY = 'genesis.lang';

export const resources = {
  pt: {
    translation: {
      // ------------------------------- Login -------------------------------
      'login.kickerOwner': 'Gestão',
      'login.kickerCashier': 'Caixa',
      'login.title': 'Entrar no Genesis',
      'login.titleOwner': 'Acesso do Gestor da Loja',
      'login.titleCashier': 'Acesso do Caixista',
      'login.descOwner': 'Gestão de stock, vendas, relatórios e subscrição do negócio.',
      'login.descCashier': 'Operação do caixa e vendas do dia.',
      'login.email': 'Email',
      'login.emailPlaceholder': 'email@empresa.com',
      'login.password': 'Senha',
      'login.passwordPlaceholder': '••••••••',
      'login.submit': 'Entrar',
      'login.submitting': 'A entrar...',
      'login.forgot': 'Esqueci a senha',
      'login.requestAccount': 'Pedir conta',
      'login.google': 'Entrar com Google',
      'login.googleChecking': 'A verificar a sessão do Google...',
      'login.googleNotConfigured':
        'Login com Google ainda não configurado. Peça a conta e entre com email e senha.',
      'login.googleNotRegistered':
        'Essa conta Google não está registada no Genesis. Peça uma conta e volte a entrar.',
      'login.foot': 'Moçambique · Valores em MZN',
      'login.superAdminBlocked': 'A conta de Super Admin usa o painel dedicado (admin-frontend).',
      'login.invalid': 'Email ou senha incorretos.',
      'login.googleLinkHint': 'Se a conta já estiver registada, entra sem senha.',

      // ------------------------- Recuperar senha -------------------------
      'reset.kicker': 'Acesso',
      'reset.title': 'Recuperar senha',
      'reset.lead': 'Enviamos um código de 6 dígitos para o seu email. Depois escolhe a nova senha.',
      'reset.codeSent': 'Código enviado. Verifique o seu email (e o spam) e introduza o código abaixo.',
      'reset.warningTitle': 'Modo directo activo',
      'reset.warning':
        'Não existe servidor de email ligado, por isso a senha muda logo à frente. ' +
        'Desligue RESET_IMMEDIATE no backend/.env antes de ir para produção.',
      'reset.email': 'Email da conta',
      'reset.emailPlaceholder': 'gerente@loja.com',
      'reset.newPassword': 'Nova palavra-passe',
      'reset.confirmPassword': 'Repetir palavra-passe',
      'reset.mismatch': 'As duas palavras-passe não coincidem.',
      'reset.submit': 'Mudar a senha',
      'reset.submitting': 'A mudar...',
      'reset.back': 'Voltar',
      'reset.goLogin': 'Ir para o login',
      'reset.doneTitle': 'Senha alterada',
      'reset.doneLead': 'Já pode entrar com a nova senha.',
      'reset.fallbackTitle': 'Por código',
      'reset.fallbackLead': 'Este servidor está no modo por código. Enviaremos o código por WhatsApp.',
      'reset.sendCode': 'Enviar código',
      'reset.code': 'Código de verificação',
      'reset.disabled': 'A recuperação de senha não está disponível neste servidor.',
      'reset.invalid': 'Não foi possível mudar a senha.',
    }
  },
  en: {
    translation: {
      'login.kickerOwner': 'Management',
      'login.kickerCashier': 'Cashier',
      'login.title': 'Sign in to Genesis',
      'login.titleOwner': 'Store Manager Access',
      'login.titleCashier': 'Cashier Access',
      'login.descOwner': 'Inventory, sales, reports and business subscription.',
      'login.descCashier': "Cashier operation and today's sales.",
      'login.email': 'Email',
      'login.emailPlaceholder': 'email@company.com',
      'login.password': 'Password',
      'login.passwordPlaceholder': '••••••••',
      'login.submit': 'Sign in',
      'login.submitting': 'Signing in...',
      'login.forgot': 'Forgot password',
      'login.requestAccount': 'Request account',
      'login.google': 'Sign in with Google',
      'login.googleChecking': 'Checking Google session...',
      'login.googleNotConfigured':
        'Google sign-in is not configured yet. Request an account and sign in with email.',
      'login.googleNotRegistered':
        'That Google account is not registered on Genesis. Request an account, then come back.',
      'login.foot': 'Mozambique · Values in MZN',
      'login.superAdminBlocked': 'The Super Admin account uses the dedicated admin panel.',
      'login.invalid': 'Incorrect email or password.',
      'login.googleLinkHint': 'If the account is already registered, you enter without a password.',

      // ------------------------- Password reset -------------------------
      'reset.kicker': 'Access',
      'reset.title': 'Reset password',
      'reset.lead': 'We send a 6-digit code to your email. Then choose the new password.',
      'reset.codeSent': 'Code sent. Check your email (and spam) and enter the code below.',
      'reset.warningTitle': 'Direct mode enabled',
      'reset.warning':
        'No email server is connected, so the password changes right here. ' +
        'Turn off RESET_IMMEDIATE in backend/.env before going to production.',
      'reset.email': 'Account email',
      'reset.emailPlaceholder': 'manager@store.com',
      'reset.newPassword': 'New password',
      'reset.confirmPassword': 'Repeat password',
      'reset.mismatch': 'The two passwords do not match.',
      'reset.submit': 'Change password',
      'reset.submitting': 'Changing...',
      'reset.back': 'Back',
      'reset.goLogin': 'Go to sign in',
      'reset.doneTitle': 'Password changed',
      'reset.doneLead': 'You can now sign in with the new password.',
      'reset.fallbackTitle': 'By code',
      'reset.fallbackLead': 'This server runs in code mode. The code is sent by WhatsApp.',
      'reset.sendCode': 'Send code',
      'reset.code': 'Verification code',
      'reset.disabled': 'Password recovery is not available on this server.',
      'reset.invalid': 'Could not change the password.',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: (() => {
      try {
        return localStorage.getItem(STORAGE_KEY) || 'pt';
      } catch {
        return 'pt';
      }
    })(),
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
    returnEmptyString: false
  });

export function setLang(lang) {
  i18n.changeLanguage(lang);
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* modo privado do browser: guarda só em memória */
  }
  document.documentElement.lang = lang;
}

export function currentLang() {
  return i18n.language || 'pt';
}

// Hook curto para os ecrãs: { t, lang, setLang }
export function useLang() {
  const { t } = useTranslation();
  return { t, lang: currentLang(), setLang };
}

export default i18n;
