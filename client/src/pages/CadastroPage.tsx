import { useState, useEffect, useCallback } from 'react';
import { api, Filamento, Impressora } from '../api/client';

type SubTab = 'filamentos' | 'impressoras';

// === Filamento Form State ===
interface FilamentoForm {
  nome: string;
  tipo: string;
  cor: string;
  precoPorKg: number;
  densidade: number;
  estoqueKg: number;
  estoqueMinKg: number;
}

const emptyFilamentoForm: FilamentoForm = {
  nome: '',
  tipo: 'PLA',
  cor: '',
  precoPorKg: 0,
  densidade: 0,
  estoqueKg: 0,
  estoqueMinKg: 0.2,
};

// === Impressora Form State ===
interface ImpressoraForm {
  nome: string;
  marca: string;
  modelo: string;
  potenciaWatts: number;
  valorCompra: number;
  vidaUtilHoras: number;
  horasUsadas: number;
  manutencaoPorHora: number;
  taxaFalhaPercentual: number;
  volumeMaxX: number;
  volumeMaxY: number;
  volumeMaxZ: number;
  ativa: boolean;
}

const emptyImpressoraForm: ImpressoraForm = {
  nome: '',
  marca: '',
  modelo: '',
  potenciaWatts: 0,
  valorCompra: 0,
  vidaUtilHoras: 0,
  horasUsadas: 0,
  manutencaoPorHora: 0,
  taxaFalhaPercentual: 5,
  volumeMaxX: 0,
  volumeMaxY: 0,
  volumeMaxZ: 0,
  ativa: true,
};

const TIPOS_FILAMENTO = ['PLA', 'PETG', 'ABS', 'TPU', 'Nylon', 'Resina', 'Outro'];

export function CadastroPage() {
  const [subTab, setSubTab] = useState<SubTab>('filamentos');

  return (
    <div className="cadastro-page">
      <div className="sub-tabs">
        <button
          className={`sub-tab ${subTab === 'filamentos' ? 'active' : ''}`}
          onClick={() => setSubTab('filamentos')}
        >
          🧵 Filamentos
        </button>
        <button
          className={`sub-tab ${subTab === 'impressoras' ? 'active' : ''}`}
          onClick={() => setSubTab('impressoras')}
        >
          🖨️ Impressoras
        </button>
      </div>

      {subTab === 'filamentos' && <FilamentosSection />}
      {subTab === 'impressoras' && <ImpressorasSection />}
    </div>
  );
}

// ============================================================
// FILAMENTOS SECTION
// ============================================================
function FilamentosSection() {
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FilamentoForm>(emptyFilamentoForm);
  const [abastecerId, setAbastecerId] = useState<number | null>(null);
  const [abastecerGramas, setAbastecerGramas] = useState(1000);

  const loadFilamentos = useCallback(async () => {
    try {
      const data = await api.listarFilamentos();
      setFilamentos(data);
    } catch (e) {
      console.error('Erro ao carregar filamentos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFilamentos(); }, [loadFilamentos]);

  const handleSubmit = async () => {
    if (!form.nome || form.precoPorKg <= 0) return;
    try {
      const payload = {
        nome: form.nome,
        tipo: form.tipo,
        cor: form.cor || 'Padrão',
        precoPorKg: form.precoPorKg,
        densidade: form.densidade > 0 ? form.densidade : undefined,
        estoqueKg: form.estoqueKg,
        estoqueMinKg: form.estoqueMinKg,
      };

      if (editingId) {
        await api.atualizarFilamento(editingId, payload);
      } else {
        await api.criarFilamento(payload);
      }
      setForm(emptyFilamentoForm);
      setShowForm(false);
      setEditingId(null);
      await loadFilamentos();
    } catch (e) {
      console.error('Erro ao salvar filamento:', e);
    }
  };

  const handleEdit = (f: Filamento) => {
    setForm({
      nome: f.nome,
      tipo: f.tipo,
      cor: f.cor,
      precoPorKg: f.precoPorKg,
      densidade: f.densidade || 0,
      estoqueKg: f.estoqueKg,
      estoqueMinKg: f.estoqueMinKg,
    });
    setEditingId(f.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este filamento?')) return;
    try {
      await api.deletarFilamento(id);
      await loadFilamentos();
    } catch (e) {
      console.error('Erro ao deletar filamento:', e);
    }
  };

  const handleAbastecer = async () => {
    if (!abastecerId || abastecerGramas <= 0) return;
    try {
      await api.abastecerFilamento(abastecerId, abastecerGramas);
      setAbastecerId(null);
      setAbastecerGramas(1000);
      await loadFilamentos();
    } catch (e) {
      console.error('Erro ao abastecer:', e);
    }
  };

  if (loading) return <div className="loading">Carregando filamentos...</div>;

  return (
    <div>
      <div className="cadastro-header">
        <h2>Filamentos / Estoque</h2>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyFilamentoForm); setEditingId(null); setShowForm(true); }}
        >
          + Adicionar
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal cadastro-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Editar Filamento' : 'Novo Filamento'}</h3>
            <div className="cadastro-form-grid">
              <div className="input-group">
                <label className="input-label">Nome *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: PLA Branco Creality"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Tipo</label>
                <div className="select-wrapper">
                  <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                    {TIPOS_FILAMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Cor</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.cor}
                    onChange={(e) => setForm({ ...form, cor: e.target.value })}
                    placeholder="Branco, Preto, etc."
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Preço por Kg (R$) *</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.precoPorKg || ''}
                    onChange={(e) => setForm({ ...form, precoPorKg: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">R$/kg</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Densidade (g/cm³)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.densidade || ''}
                    onChange={(e) => setForm({ ...form, densidade: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">g/cm³</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Estoque Atual (kg)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.estoqueKg || ''}
                    onChange={(e) => setForm({ ...form, estoqueKg: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Estoque Mínimo (kg)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.estoqueMinKg || ''}
                    onChange={(e) => setForm({ ...form, estoqueMinKg: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Abastecer Modal */}
      {abastecerId !== null && (
        <div className="modal-overlay" onClick={() => setAbastecerId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Abastecer Estoque</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Informe a quantidade em gramas a adicionar ao estoque.
            </p>
            <div className="input-group">
              <label className="input-label">Quantidade (gramas)</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={abastecerGramas}
                  onChange={(e) => setAbastecerGramas(parseFloat(e.target.value) || 0)}
                  min={1}
                  step={1}
                />
                <span className="input-suffix">g</span>
              </div>
            </div>
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setAbastecerId(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAbastecer}>Abastecer</button>
            </div>
          </div>
        </div>
      )}

      {/* Filamentos List */}
      {filamentos.length === 0 ? (
        <div className="history-empty">
          <p>Nenhum filamento cadastrado.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Adicione seu primeiro filamento para gerenciar o estoque.</p>
        </div>
      ) : (
        <div className="cadastro-list">
          {filamentos.map((f) => {
            const estoqueBaixo = f.estoqueKg <= f.estoqueMinKg;
            const estoquePercent = f.estoqueMinKg > 0
              ? Math.min((f.estoqueKg / (f.estoqueMinKg * 5)) * 100, 100)
              : Math.min(f.estoqueKg * 100, 100);

            return (
              <div key={f.id} className={`cadastro-item ${estoqueBaixo ? 'estoque-alert' : ''}`}>
                <div className="cadastro-item-header">
                  <div className="cadastro-item-info">
                    <span className="cadastro-item-name">{f.nome}</span>
                    <span className="cadastro-item-meta">{f.tipo} • {f.cor}</span>
                  </div>
                  <span className="cadastro-item-price">R$ {f.precoPorKg.toFixed(2)}/kg</span>
                </div>
                <div className="cadastro-item-estoque">
                  <div className="estoque-info">
                    <span>Estoque: <strong>{f.estoqueKg.toFixed(2)} kg</strong></span>
                    {estoqueBaixo && <span className="estoque-badge-low">⚠️ Baixo</span>}
                  </div>
                  <div className="estoque-bar">
                    <div
                      className={`estoque-bar-fill ${estoqueBaixo ? 'low' : ''}`}
                      style={{ width: `${estoquePercent}%` }}
                    />
                  </div>
                  <span className="estoque-min-label">Mín: {f.estoqueMinKg.toFixed(2)} kg</span>
                </div>
                <div className="cadastro-item-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => setAbastecerId(f.id)}>
                    + Abastecer
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(f)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================
// IMPRESSORAS SECTION
// ============================================================
function ImpressorasSection() {
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ImpressoraForm>(emptyImpressoraForm);

  const loadImpressoras = useCallback(async () => {
    try {
      const data = await api.listarImpressoras();
      setImpressoras(data);
    } catch (e) {
      console.error('Erro ao carregar impressoras:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImpressoras(); }, [loadImpressoras]);

  const handleSubmit = async () => {
    if (!form.nome || form.valorCompra <= 0 || form.vidaUtilHoras <= 0) return;
    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        marca: form.marca,
        modelo: form.modelo,
        potenciaWatts: form.potenciaWatts,
        valorCompra: form.valorCompra,
        vidaUtilHoras: form.vidaUtilHoras,
        horasUsadas: form.horasUsadas,
        manutencaoPorHora: form.manutencaoPorHora,
        taxaFalhaPercentual: form.taxaFalhaPercentual,
        ativa: form.ativa,
      };
      if (form.volumeMaxX > 0) payload.volumeMaxX = form.volumeMaxX;
      if (form.volumeMaxY > 0) payload.volumeMaxY = form.volumeMaxY;
      if (form.volumeMaxZ > 0) payload.volumeMaxZ = form.volumeMaxZ;

      if (editingId) {
        await api.atualizarImpressora(editingId, payload as Partial<Impressora>);
      } else {
        await api.criarImpressora(payload as Omit<Impressora, 'id' | 'createdAt' | 'updatedAt'>);
      }
      setForm(emptyImpressoraForm);
      setShowForm(false);
      setEditingId(null);
      await loadImpressoras();
    } catch (e) {
      console.error('Erro ao salvar impressora:', e);
    }
  };

  const handleEdit = (imp: Impressora) => {
    setForm({
      nome: imp.nome,
      marca: imp.marca,
      modelo: imp.modelo,
      potenciaWatts: imp.potenciaWatts,
      valorCompra: imp.valorCompra,
      vidaUtilHoras: imp.vidaUtilHoras,
      horasUsadas: imp.horasUsadas,
      manutencaoPorHora: imp.manutencaoPorHora,
      taxaFalhaPercentual: imp.taxaFalhaPercentual,
      volumeMaxX: imp.volumeMaxX || 0,
      volumeMaxY: imp.volumeMaxY || 0,
      volumeMaxZ: imp.volumeMaxZ || 0,
      ativa: imp.ativa,
    });
    setEditingId(imp.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover esta impressora?')) return;
    try {
      await api.deletarImpressora(id);
      await loadImpressoras();
    } catch (e) {
      console.error('Erro ao deletar impressora:', e);
    }
  };

  if (loading) return <div className="loading">Carregando impressoras...</div>;

  return (
    <div>
      <div className="cadastro-header">
        <h2>Impressoras</h2>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(emptyImpressoraForm); setEditingId(null); setShowForm(true); }}
        >
          + Adicionar
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal cadastro-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingId ? 'Editar Impressora' : 'Nova Impressora'}</h3>
            <div className="cadastro-form-grid">
              <div className="input-group">
                <label className="input-label">Nome *</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Ender 3 V2"
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Marca</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.marca}
                    onChange={(e) => setForm({ ...form, marca: e.target.value })}
                    placeholder="Creality, Anycubic..."
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Modelo</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    placeholder="V2, S1 Pro..."
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Potência (Watts) *</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.potenciaWatts || ''}
                    onChange={(e) => setForm({ ...form, potenciaWatts: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={1}
                  />
                  <span className="input-suffix">W</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Valor de Compra (R$) *</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.valorCompra || ''}
                    onChange={(e) => setForm({ ...form, valorCompra: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">R$</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Vida Útil (Horas) *</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.vidaUtilHoras || ''}
                    onChange={(e) => setForm({ ...form, vidaUtilHoras: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={1}
                  />
                  <span className="input-suffix">h</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Horas Usadas</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.horasUsadas || ''}
                    onChange={(e) => setForm({ ...form, horasUsadas: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={1}
                  />
                  <span className="input-suffix">h</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Manutenção/Hora (R$)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.manutencaoPorHora || ''}
                    onChange={(e) => setForm({ ...form, manutencaoPorHora: parseFloat(e.target.value) || 0 })}
                    min={0}
                    step={0.01}
                  />
                  <span className="input-suffix">R$/h</span>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">Taxa de Falha (%)</label>
                <div className="input-wrapper">
                  <input
                    type="number"
                    value={form.taxaFalhaPercentual}
                    onChange={(e) => setForm({ ...form, taxaFalhaPercentual: parseFloat(e.target.value) || 0 })}
                    min={0}
                    max={90}
                    step={1}
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>
              <div className="input-group cadastro-form-full">
                <label className="input-label">Volume Máx. Impressão (mm)</label>
                <div className="volume-inputs">
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={form.volumeMaxX || ''}
                      onChange={(e) => setForm({ ...form, volumeMaxX: parseFloat(e.target.value) || 0 })}
                      placeholder="X"
                      min={0}
                    />
                    <span className="input-suffix">X</span>
                  </div>
                  <span className="volume-separator">×</span>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={form.volumeMaxY || ''}
                      onChange={(e) => setForm({ ...form, volumeMaxY: parseFloat(e.target.value) || 0 })}
                      placeholder="Y"
                      min={0}
                    />
                    <span className="input-suffix">Y</span>
                  </div>
                  <span className="volume-separator">×</span>
                  <div className="input-wrapper">
                    <input
                      type="number"
                      value={form.volumeMaxZ || ''}
                      onChange={(e) => setForm({ ...form, volumeMaxZ: parseFloat(e.target.value) || 0 })}
                      placeholder="Z"
                      min={0}
                    />
                    <span className="input-suffix">Z</span>
                  </div>
                </div>
              </div>
              <div className="input-group">
                <label className="input-label checkbox-label">
                  <input
                    type="checkbox"
                    checked={form.ativa}
                    onChange={(e) => setForm({ ...form, ativa: e.target.checked })}
                  />
                  Impressora ativa
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSubmit}>
                {editingId ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Impressoras List */}
      {impressoras.length === 0 ? (
        <div className="history-empty">
          <p>Nenhuma impressora cadastrada.</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Adicione sua primeira impressora para usar nos cálculos.</p>
        </div>
      ) : (
        <div className="cadastro-list">
          {impressoras.map((imp) => {
            const vidaRestante = Math.max(imp.vidaUtilHoras - imp.horasUsadas, 0);
            const vidaRestantePercent = (vidaRestante / imp.vidaUtilHoras) * 100;

            return (
              <div key={imp.id} className={`cadastro-item ${!imp.ativa ? 'inativa' : ''}`}>
                <div className="cadastro-item-header">
                  <div className="cadastro-item-info">
                    <span className="cadastro-item-name">
                      {imp.nome}
                      {!imp.ativa && <span className="status-badge inativa">Inativa</span>}
                    </span>
                    <span className="cadastro-item-meta">
                      {imp.marca} {imp.modelo} • {imp.potenciaWatts}W
                    </span>
                  </div>
                  <span className="cadastro-item-price">R$ {imp.valorCompra.toFixed(2)}</span>
                </div>
                <div className="cadastro-item-stats">
                  <div className="stat-row">
                    <span>Vida útil restante:</span>
                    <strong>{vidaRestante.toFixed(0)}h / {imp.vidaUtilHoras.toFixed(0)}h ({vidaRestantePercent.toFixed(0)}%)</strong>
                  </div>
                  <div className="estoque-bar">
                    <div
                      className={`estoque-bar-fill ${vidaRestantePercent < 20 ? 'low' : ''}`}
                      style={{ width: `${vidaRestantePercent}%` }}
                    />
                  </div>
                  <div className="stat-row">
                    <span>Manutenção:</span>
                    <span>R$ {imp.manutencaoPorHora.toFixed(2)}/h</span>
                  </div>
                  <div className="stat-row">
                    <span>Taxa de falha:</span>
                    <span>{imp.taxaFalhaPercentual}%</span>
                  </div>
                  {(imp.volumeMaxX && imp.volumeMaxY && imp.volumeMaxZ) && (
                    <div className="stat-row">
                      <span>Volume máx:</span>
                      <span>{imp.volumeMaxX} × {imp.volumeMaxY} × {imp.volumeMaxZ} mm</span>
                    </div>
                  )}
                </div>
                <div className="cadastro-item-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(imp)}>
                    ✏️ Editar
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(imp.id)}>
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
