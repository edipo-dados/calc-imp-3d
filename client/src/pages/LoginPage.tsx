import { useState } from 'react';
import { api, UsuarioInfo } from '../api/client';

interface LoginPageProps {
  onLogin: (usuario: UsuarioInfo, token: string) => void;
}

type Mode = 'login' | 'registrar';

export function LoginPage({ onLogin }: LoginPageProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api.login(email, senha);
      onLogin(result.usuario, result.token);
    } catch (err: unknown) {
      const e = err as { error?: string };
      setError(e.error || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrar = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await api.registrar(nome, email, senha);
      setSuccess(result.message);
      setMode('login');
      setNome('');
      setSenha('');
    } catch (err: unknown) {
      const e = err as { error?: string; errors?: Record<string, string[]> };
      if (e.errors) {
        const msgs = Object.values(e.errors).flat().join(', ');
        setError(msgs);
      } else {
        setError(e.error || 'Erro ao registrar');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') handleLogin();
    else handleRegistrar();
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">🖨️</span>
          <h1>Calculadora 3D</h1>
          <p>Sistema de precificação para impressão 3D</p>
        </div>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          >
            Entrar
          </button>
          <button
            className={`login-tab ${mode === 'registrar' ? 'active' : ''}`}
            onClick={() => { setMode('registrar'); setError(''); setSuccess(''); }}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'registrar' && (
            <div className="input-group">
              <label className="input-label">Nome</label>
              <div className="input-wrapper">
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Email</label>
            <div className="input-wrapper">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Senha</label>
            <div className="input-wrapper">
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder={mode === 'registrar' ? 'Mínimo 6 caracteres' : 'Sua senha'}
                required
                minLength={mode === 'registrar' ? 6 : 1}
              />
            </div>
          </div>

          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}

          <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
            {loading
              ? 'Aguarde...'
              : mode === 'login'
                ? 'Entrar'
                : 'Criar Conta'
            }
          </button>

          {mode === 'registrar' && (
            <p className="login-info">
              Após o cadastro, um administrador precisa aprovar seu acesso.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
