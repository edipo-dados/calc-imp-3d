import { useState, useCallback, useEffect } from 'react';
import { CalculadoraPage } from './pages/CalculadoraPage';
import { HistoricoPage } from './pages/HistoricoPage';
import { CadastroPage } from './pages/CadastroPage';
import { ProjecaoPage } from './pages/ProjecaoPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { SobrePage } from './pages/SobrePage';
import { CalculoInput, UsuarioInfo, api } from './api/client';

type Tab = 'calculadora' | 'historico' | 'cadastro' | 'projecao' | 'admin' | 'sobre';

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioInfo | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('calculadora');
  const [duplicateValues, setDuplicateValues] = useState<Partial<CalculoInput> | undefined>(undefined);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const timeout = setTimeout(() => {
        // If API doesn't respond in 5s, skip auth check
        setCheckingAuth(false);
      }, 5000);

      api.getMe()
        .then((user) => setUsuario(user))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          clearTimeout(timeout);
          setCheckingAuth(false);
        });
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const handleLogin = useCallback((user: UsuarioInfo, token: string) => {
    localStorage.setItem('token', token);
    setUsuario(user);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setUsuario(null);
    setActiveTab('calculadora');
  }, []);

  const handleDuplicate = useCallback((inputs: CalculoInput) => {
    setDuplicateValues(inputs);
    setActiveTab('calculadora');
  }, []);

  const navigateToHistory = useCallback(() => {
    setActiveTab('historico');
  }, []);

  // Loading auth check
  if (checkingAuth) {
    return (
      <div className="login-page">
        <div className="loading">Verificando sessão...</div>
      </div>
    );
  }

  // Not logged in → show login page
  if (!usuario) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const isAdmin = usuario.role === 'admin';

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-title">
            <span>🖨️</span>
            Calculadora 3D
          </div>
          <nav className="nav-tabs">
            <button
              className={`nav-tab ${activeTab === 'calculadora' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculadora')}
            >
              Calculadora
            </button>
            <button
              className={`nav-tab ${activeTab === 'historico' ? 'active' : ''}`}
              onClick={() => setActiveTab('historico')}
            >
              Histórico
            </button>
            <button
              className={`nav-tab ${activeTab === 'cadastro' ? 'active' : ''}`}
              onClick={() => setActiveTab('cadastro')}
            >
              Cadastro
            </button>
            <button
              className={`nav-tab ${activeTab === 'projecao' ? 'active' : ''}`}
              onClick={() => setActiveTab('projecao')}
            >
              Projeção
            </button>
            {isAdmin && (
              <button
                className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                👑 Admin
              </button>
            )}
            <button
              className={`nav-tab ${activeTab === 'sobre' ? 'active' : ''}`}
              onClick={() => setActiveTab('sobre')}
            >
              Sobre
            </button>
          </nav>
          <div className="user-info">
            <span className="user-name">{usuario.nome}</span>
            <button className="btn btn-sm btn-secondary" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {activeTab === 'calculadora' && (
          <CalculadoraPage
            initialValues={duplicateValues}
            onNavigateToHistory={navigateToHistory}
          />
        )}
        {activeTab === 'historico' && (
          <HistoricoPage onDuplicate={handleDuplicate} />
        )}
        {activeTab === 'cadastro' && (
          <CadastroPage />
        )}
        {activeTab === 'projecao' && (
          <ProjecaoPage />
        )}
        {activeTab === 'admin' && isAdmin && (
          <AdminPage />
        )}
        {activeTab === 'sobre' && (
          <SobrePage />
        )}
      </main>
    </div>
  );
}
