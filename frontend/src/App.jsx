import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ConfirmProvider, ToastProvider } from './components/ui';
import { SessionProvider, RequireOwner, useSession, FullPageSpinner } from './utils/session';
// Code-splitting por area: o terminal POS nao descarrega os graficos do painel
// (Recharts), e o painel nao descarrega o POS. Requisito: POS < 2 s em 3G.
const Login = lazy(() => import('./pages/auth/Login'));
const RequestAccount = lazy(() => import('./pages/auth/RequestAccount'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const Support = lazy(() => import('./pages/auth/Support'));
const VerifyReceipt = lazy(() => import('./pages/VerifyReceipt'));
const Terminal = lazy(() => import('./pages/pos/Terminal'));
const AppShell = lazy(() => import('./layouts/AppShell'));
const Home = lazy(() => import('./pages/owner/Home'));
const Sales = lazy(() => import('./pages/owner/Sales'));
const Products = lazy(() => import('./pages/owner/Products'));
const Suppliers = lazy(() => import('./pages/owner/Suppliers'));
const Debts = lazy(() => import('./pages/owner/Debts'));
const Team = lazy(() => import('./pages/owner/Team'));
const Reports = lazy(() => import('./pages/owner/Reports'));
const Settings = lazy(() => import('./pages/owner/Settings'));
const Onboarding = lazy(() => import('./pages/owner/Onboarding'));

// Sessao terminou (senha mudou, conta desactivada, expirou): o painel volta ao
// ecra de entrada com o motivo. O terminal trata o seu proprio caso.
function SessionEndedListener() {
  const navigate = useNavigate();
  const location = useLocation();
  const { reload } = useSession();
  useEffect(() => {
    const onEnded = (e) => {
      if (location.pathname.startsWith('/terminal')) return;
      reload();
      navigate('/entrar?motivo=' + encodeURIComponent(e.detail?.code || 'SESSION_EXPIRED'), { replace: true });
    };
    window.addEventListener('genesis:session-ended', onEnded);
    return () => window.removeEventListener('genesis:session-ended', onEnded);
  }, [location.pathname, navigate, reload]);
  return null;
}

function Root() {
  const { loading, user } = useSession();
  if (loading) return <FullPageSpinner />;
  if (user?.role === 'owner') return <Navigate to="/app" replace />;
  if (user?.role === 'cashier') return <Navigate to="/terminal" replace />;
  return <Navigate to="/entrar" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <SessionProvider>
            <SessionEndedListener />
            <Suspense fallback={<FullPageSpinner />}>
            <Routes>
              <Route path="/" element={<Root />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/pedir-conta" element={<RequestAccount />} />
              <Route path="/recuperar-senha" element={<ResetPassword />} />
              <Route path="/suporte" element={<Support />} />
              <Route path="/verify/:saleId" element={<VerifyReceipt />} />
              <Route path="/terminal" element={<Terminal />} />
              <Route path="/onboarding" element={<RequireOwner><Onboarding /></RequireOwner>} />
              <Route path="/app" element={<RequireOwner><AppShell /></RequireOwner>}>
                <Route index element={<Home />} />
                <Route path="vendas" element={<Sales />} />
                <Route path="produtos" element={<Products />} />
                <Route path="fornecedores" element={<Suppliers />} />
                <Route path="chenecas" element={<Debts />} />
                <Route path="equipa" element={<Team />} />
                <Route path="relatorios" element={<Reports />} />
                <Route path="definicoes" element={<Settings />} />
              </Route>

              {/* Enderecos antigos (marcadores, links ja partilhados). */}
              <Route path="/login" element={<Navigate to="/entrar" replace />} />
              <Route path="/request-account" element={<Navigate to="/pedir-conta" replace />} />
              <Route path="/forgot-password" element={<Navigate to="/recuperar-senha" replace />} />
              <Route path="/reset-password" element={<Navigate to="/recuperar-senha" replace />} />
              <Route path="/pos" element={<Navigate to="/terminal" replace />} />
              <Route path="/cashier/*" element={<Navigate to="/terminal" replace />} />
              <Route path="/hub" element={<Navigate to="/terminal" replace />} />
              <Route path="/owner/*" element={<Navigate to="/app" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </SessionProvider>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
