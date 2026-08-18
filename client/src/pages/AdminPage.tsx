import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

interface UsuarioPendente {
  id: number;
  nome: string;
  email: string;
  createdAt: string;
}

interface UsuarioLista {
  id: number;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
}

export function AdminPage() {
  const [pendentes, setPendentes] = useState<UsuarioPendente[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<'pendentes' | 'todos'>('pendentes');

  const loadData = useCallback(async () => {
    try {
      const [pend, all] = await Promise.all([
        api.listarPendentes(),
        api.listarUsuarios(),
      ]);
      setPendentes(pend);
      setUsuarios(all);
    } catch (e) {
      console.error('Erro ao carregar usuários:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAprovar = async (id: number) => {
    try {
      await api.aprovarUsuario(id);
      await loadData();
    } catch (e) {
      console.error('Erro ao aprovar:', e);
    }
  };

  const handleRejeitar = async (id: number) => {
    if (!confirm('Rejeitar e remover este cadastro?')) return;
    try {
      await api.rejeitarUsuario(id);
      await loadData();
    } catch (e) {
      console.error('Erro ao rejeitar:', e);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  if (loading) return <div className="loading">Carregando...</div>;

  return (
    <div className="admin-page">
      <div className="sub-tabs">
        <button
          className={`sub-tab ${subTab === 'pendentes' ? 'active' : ''}`}
          onClick={() => setSubTab('pendentes')}
        >
          Pendentes {pendentes.length > 0 && <span className="badge">{pendentes.length}</span>}
        </button>
        <button
          className={`sub-tab ${subTab === 'todos' ? 'active' : ''}`}
          onClick={() => setSubTab('todos')}
        >
          Todos os Usuários
        </button>
      </div>

      {subTab === 'pendentes' && (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Cadastros Pendentes de Aprovação</h2>
          {pendentes.length === 0 ? (
            <div className="history-empty">
              <p>Nenhum cadastro pendente.</p>
            </div>
          ) : (
            <div className="cadastro-list">
              {pendentes.map((u) => (
                <div key={u.id} className="cadastro-item">
                  <div className="cadastro-item-header">
                    <div className="cadastro-item-info">
                      <span className="cadastro-item-name">{u.nome}</span>
                      <span className="cadastro-item-meta">{u.email}</span>
                    </div>
                    <span className="cadastro-item-meta">{formatDate(u.createdAt)}</span>
                  </div>
                  <div className="cadastro-item-actions" style={{ marginTop: '0.75rem' }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleAprovar(u.id)}>
                      ✅ Aprovar
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleRejeitar(u.id)}>
                      ❌ Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === 'todos' && (
        <div>
          <h2 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Usuários do Sistema</h2>
          <div className="cadastro-list">
            {usuarios.map((u) => (
              <div key={u.id} className="cadastro-item">
                <div className="cadastro-item-header">
                  <div className="cadastro-item-info">
                    <span className="cadastro-item-name">{u.nome}</span>
                    <span className="cadastro-item-meta">{u.email}</span>
                  </div>
                  <span className={`status-badge ${u.role}`}>
                    {u.role === 'admin' ? '👑 Admin' : u.role === 'usuario' ? '✓ Ativo' : '⏳ Pendente'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
