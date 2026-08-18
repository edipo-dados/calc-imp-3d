import { useState, useEffect, useCallback, useRef } from 'react';
import { api, CalculoInput, ResultadoCalculo, Filamento, Impressora, PerfilCustos, CustoExtra } from '../api/client';
import { FormSection } from '../components/FormSection';
import { InputField } from '../components/InputField';
import { CostVisualization } from '../components/CostVisualization';
import { PricePanel } from '../components/PricePanel';

interface CalculadoraPageProps {
  initialValues?: Partial<CalculoInput>;
  onNavigateToHistory?: () => void;
}

type Modo = 'rapido' | 'avancado';

interface PecaItem {
  id: string;
  filamentoId: number | null;
  pesoGramas: number;
  pesoSuporteGramas: number;
  precoPorKg: number;
  horasImpressao: number;
  filamentoNome: string;
}

const DEFAULT_VALUES: CalculoInput = {
  pesoGramas: 50,
  precoPorKg: 120,
  desperdicioPercentual: 5,
  potenciaWatts: 200,
  horasImpressao: 3,
  tarifaKwh: 0.85,
  valorImpressora: 3000,
  vidaUtilHoras: 5000,
  manutencaoPorHora: 0.50,
  horasTrabalho: 0.5,
  valorHora: 50,
  taxaFalhaPercentual: 10,
  custoFixoMensal: 500,
  impressoesPorMes: 30,
  margemPercentual: 50,
};

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

export function CalculadoraPage({ initialValues, onNavigateToHistory }: CalculadoraPageProps) {
  const [modo, setModo] = useState<Modo>('rapido');
  const [inputs, setInputs] = useState<CalculoInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [perfis, setPerfis] = useState<PerfilCustos[]>([]);
  const [perfilSelecionadoId, setPerfilSelecionadoId] = useState<number | null>(null);
  const [impressoraSelecionadaId, setImpressoraSelecionadaId] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [nomePeca, setNomePeca] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [alertasEstoque, setAlertasEstoque] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Multi-peça
  const [pecas, setPecas] = useState<PecaItem[]>([
    { id: generateId(), filamentoId: null, pesoGramas: 50, pesoSuporteGramas: 0, precoPorKg: 120, horasImpressao: 3, filamentoNome: '' },
  ]);

  // Custos extras
  const [custosExtras, setCustosExtras] = useState<CustoExtra[]>([]);

  // Margem de lucro (separate since it's always editable)
  const [margemPercentual, setMargemPercentual] = useState(50);

  // Load data
  useEffect(() => {
    api.listarFilamentos().then(setFilamentos).catch(console.error);
    api.listarImpressoras().then((data) => {
      setImpressoras(data.filter((i) => i.ativa !== false));
    }).catch(console.error);
    api.listarPerfis().then((data) => {
      setPerfis(data.filter((p) => p.ativo));
      // Auto-select first active profile
      const ativos = data.filter((p) => p.ativo);
      if (ativos.length > 0) {
        setPerfilSelecionadoId(ativos[0].id);
      }
    }).catch(console.error);
  }, []);

  // Apply profile when selected (tarifa, mão de obra, custos fixos, desperdício)
  // Impressora fields (potência, valor, vidaUtil, manutenção, taxa falha) vêm do seletor de impressora
  useEffect(() => {
    if (perfilSelecionadoId) {
      const perfil = perfis.find((p) => p.id === perfilSelecionadoId);
      if (perfil) {
        setInputs((prev) => ({
          ...prev,
          tarifaKwh: perfil.tarifaKwh,
          horasTrabalho: perfil.horasTrabalho,
          valorHora: perfil.valorHora,
          custoFixoMensal: perfil.custoFixoMensal,
          impressoesPorMes: perfil.impressoesPorMes,
          desperdicioPercentual: perfil.desperdicioPercentual,
          // Só aplica campos de impressora do perfil se nenhuma impressora estiver selecionada
          ...(impressoraSelecionadaId ? {} : {
            valorImpressora: perfil.valorImpressora,
            vidaUtilHoras: perfil.vidaUtilHoras,
            manutencaoPorHora: perfil.manutencaoPorHora,
            taxaFalhaPercentual: perfil.taxaFalhaPercentual,
            potenciaWatts: perfil.potenciaWatts,
          }),
        }));
      }
    }
  }, [perfilSelecionadoId, perfis, impressoraSelecionadaId]);

  // Apply impressora when selected (overrides perfil for machine-specific fields)
  useEffect(() => {
    if (impressoraSelecionadaId) {
      const imp = impressoras.find((i) => i.id === impressoraSelecionadaId);
      if (imp) {
        setInputs((prev) => ({
          ...prev,
          potenciaWatts: imp.potenciaWatts,
          valorImpressora: imp.valorCompra,
          vidaUtilHoras: imp.vidaUtilHoras,
          manutencaoPorHora: imp.manutencaoPorHora,
          taxaFalhaPercentual: imp.taxaFalhaPercentual,
        }));
      }
    }
  }, [impressoraSelecionadaId, impressoras]);

  // Apply initialValues when they change (duplicate feature)
  useEffect(() => {
    if (initialValues) {
      setInputs({ ...DEFAULT_VALUES, ...initialValues });
      if (initialValues.margemPercentual !== undefined) {
        setMargemPercentual(initialValues.margemPercentual);
      }
    }
  }, [initialValues]);

  // Build the full CalculoInput from the first piece (for single-piece calc)
  // For multi-piece, we calc each independently
  const buildInputForPeca = useCallback((peca: PecaItem): CalculoInput => {
    return {
      ...inputs,
      pesoGramas: peca.pesoGramas + peca.pesoSuporteGramas,
      precoPorKg: peca.precoPorKg,
      horasImpressao: peca.horasImpressao,
      margemPercentual,
    };
  }, [inputs, margemPercentual]);

  // Debounced calculation
  const calcular = useCallback((inputData: CalculoInput) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.calcular(inputData);
        setResultado(result);
      } catch (err) {
        console.error('Erro ao calcular:', err);
      }
    }, 300);
  }, []);

  // Trigger calculation on input change (uses first piece for display)
  useEffect(() => {
    const mainPeca = pecas[0];
    if (mainPeca) {
      const fullInput = buildInputForPeca(mainPeca);
      calcular(fullInput);
    }
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputs, pecas, margemPercentual, calcular, buildInputForPeca]);

  // Check stock alerts
  useEffect(() => {
    const alerts: string[] = [];
    pecas.forEach((peca) => {
      if (peca.filamentoId) {
        const fil = filamentos.find((f) => f.id === peca.filamentoId);
        if (fil) {
          const pesoTotal = peca.pesoGramas + peca.pesoSuporteGramas;
          const kgConsumido = (pesoTotal * (1 + inputs.desperdicioPercentual / 100)) / 1000;
          const novoEstoque = fil.estoqueKg - kgConsumido;
          if (novoEstoque <= fil.estoqueMinKg) {
            alerts.push(`⚠️ "${fil.nome}" ficará abaixo do estoque mínimo (${fil.estoqueMinKg.toFixed(2)} kg) após este orçamento.`);
          }
        }
      }
    });
    setAlertasEstoque(alerts);
  }, [pecas, filamentos, inputs.desperdicioPercentual]);

  const updateInput = (field: keyof CalculoInput) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const updatePeca = (pecaId: string, field: keyof PecaItem, value: number | string | null) => {
    setPecas((prev) => prev.map((p) => p.id === pecaId ? { ...p, [field]: value } : p));
  };

  const handleFilamentoSelectForPeca = (pecaId: string, filamentoIdStr: string) => {
    const filId = parseInt(filamentoIdStr);
    const fil = filamentos.find((f) => f.id === filId);
    if (fil) {
      setPecas((prev) => prev.map((p) => p.id === pecaId ? {
        ...p,
        filamentoId: fil.id,
        precoPorKg: fil.precoPorKg,
        filamentoNome: `${fil.nome} (${fil.tipo} ${fil.cor})`,
      } : p));
    }
  };

  const addPeca = () => {
    setPecas((prev) => [...prev, {
      id: generateId(),
      filamentoId: null,
      pesoGramas: 50,
      pesoSuporteGramas: 0,
      precoPorKg: 120,
      horasImpressao: 3,
      filamentoNome: '',
    }]);
  };

  const removePeca = (pecaId: string) => {
    if (pecas.length <= 1) return;
    setPecas((prev) => prev.filter((p) => p.id !== pecaId));
  };

  const addCustoExtra = () => {
    setCustosExtras((prev) => [...prev, { nome: '', valor: 0 }]);
  };

  const updateCustoExtra = (index: number, field: keyof CustoExtra, value: string | number) => {
    setCustosExtras((prev) => prev.map((e, i) => i === index ? { ...e, [field]: value } : e));
  };

  const removeCustoExtra = (index: number) => {
    setCustosExtras((prev) => prev.filter((_, i) => i !== index));
  };

  const totalExtras = custosExtras.reduce((sum, e) => sum + (e.valor || 0), 0);

  // Calculate multi-piece total
  const [resultadosMulti, setResultadosMulti] = useState<ResultadoCalculo[]>([]);

  useEffect(() => {
    if (pecas.length <= 1) {
      setResultadosMulti([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await Promise.all(pecas.map((peca) => api.calcular(buildInputForPeca(peca))));
        setResultadosMulti(results);
      } catch {
        // ignore
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [pecas, inputs, margemPercentual, buildInputForPeca]);

  const totalMultiIdeal = pecas.length > 1
    ? resultadosMulti.reduce((sum, r) => sum + r.precoIdeal, 0) + totalExtras
    : (resultado?.precoIdeal || 0) + totalExtras;

  const handleSave = async () => {
    if (!nomePeca.trim()) return;
    setSaving(true);
    try {
      // Save the first piece as the main orcamento (multi-piece info in inputs JSON)
      const mainPeca = pecas[0];
      const fullInput = buildInputForPeca(mainPeca);
      const payload = {
        ...fullInput,
        nomePeca: nomePeca.trim(),
        filamentoId: mainPeca.filamentoId || undefined,
        pesoSuporteGramas: mainPeca.pesoSuporteGramas || undefined,
        custosExtras: custosExtras.filter((e) => e.nome && e.valor > 0),
      };
      const response = await api.salvarOrcamento(payload);

      let msg = 'Orçamento salvo com sucesso!';
      if (response.alertaEstoqueBaixo) {
        msg += ' ⚠️ Estoque do filamento ficou abaixo do mínimo!';
      }
      setSaveMessage(msg);
      setShowSaveModal(false);
      setNomePeca('');
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setSaveMessage('Erro ao salvar orçamento');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handlePerfilChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setPerfilSelecionadoId(isNaN(id) ? null : id);
  };

  const handleImpressoraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    setImpressoraSelecionadaId(isNaN(id) ? null : id);
  };

  return (
    <div className="calculator-layout">
      <div className="calculator-form">
        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button
            className={`mode-toggle-btn ${modo === 'rapido' ? 'active' : ''}`}
            onClick={() => setModo('rapido')}
          >
            ⚡ Rápido
          </button>
          <button
            className={`mode-toggle-btn ${modo === 'avancado' ? 'active' : ''}`}
            onClick={() => setModo('avancado')}
          >
            🔧 Avançado
          </button>
        </div>

        {/* Profile Selector (modo rápido) */}
        {modo === 'rapido' && perfis.length > 0 && (
          <FormSection title="Perfil de Custos" icon="⚙️">
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Perfil ativo</label>
              <div className="select-wrapper">
                <select value={perfilSelecionadoId || ''} onChange={handlePerfilChange}>
                  <option value="" disabled>Selecione um perfil...</option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — R$ {p.valorImpressora.toFixed(0)} / {p.potenciaWatts}W
                    </option>
                  ))}
                </select>
              </div>
              <span className="input-hint">Define automaticamente: impressora, energia, mão de obra e custos fixos</span>
            </div>
          </FormSection>
        )}

        {/* Profile Selector (modo avançado) */}
        {modo === 'avancado' && perfis.length > 0 && (
          <FormSection title="Perfil Base (opcional)" icon="⚙️">
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Carregar valores de um perfil</label>
              <div className="select-wrapper">
                <select value={perfilSelecionadoId || ''} onChange={handlePerfilChange}>
                  <option value="">Nenhum (valores manuais)</option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
              </div>
              <span className="input-hint">Preenche os campos abaixo — você pode sobrescrever qualquer valor</span>
            </div>
          </FormSection>
        )}

        {/* Stock Alerts */}
        {alertasEstoque.length > 0 && (
          <div>
            {alertasEstoque.map((alerta, i) => (
              <div key={i} className="stock-alert">{alerta}</div>
            ))}
          </div>
        )}

        {/* Impressora selector - visible in both modes */}
        <FormSection title="Impressora" icon="🖨️">
          {impressoras.length > 0 ? (
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Selecionar impressora cadastrada</label>
              <div className="select-wrapper">
                <select value={impressoraSelecionadaId || ''} onChange={handleImpressoraChange}>
                  <option value="" disabled>Selecione uma impressora...</option>
                  {impressoras.map((imp) => (
                    <option key={imp.id} value={imp.id}>
                      {imp.nome} {imp.marca && `(${imp.marca})`} — {imp.potenciaWatts}W
                    </option>
                  ))}
                </select>
              </div>
              <span className="input-hint">Define: potência, valor, vida útil, manutenção e taxa de falha</span>
            </div>
          ) : (
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <span className="input-hint">Nenhuma impressora cadastrada. Cadastre na aba Cadastro → Impressoras.</span>
            </div>
          )}
        </FormSection>

        {/* Multi-peça */}
        {pecas.map((peca, index) => (
          <div key={peca.id} className={pecas.length > 1 ? 'peca-card' : ''}>
            {pecas.length > 1 && (
              <div className="peca-card-header">
                <span className="peca-card-title">Peça {index + 1}</span>
                <button className="peca-card-remove" onClick={() => removePeca(peca.id)} title="Remover peça">✕</button>
              </div>
            )}

            {/* Filamento */}
            <FormSection title={pecas.length > 1 ? `Filamento — Peça ${index + 1}` : 'Filamento'} icon="🧵">
              {filamentos.length > 0 && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Selecionar filamento cadastrado</label>
                  <div className="select-wrapper">
                    <select
                      value={peca.filamentoId || ''}
                      onChange={(e) => handleFilamentoSelectForPeca(peca.id, e.target.value)}
                    >
                      <option value="" disabled>Selecione um filamento...</option>
                      {filamentos.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nome} ({f.tipo} {f.cor}) — R$ {f.precoPorKg.toFixed(2)}/kg {f.estoqueKg <= f.estoqueMinKg ? '⚠️' : ''} [{f.estoqueKg.toFixed(2)} kg]
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="input-hint">Preenche automaticamente o preço/kg, tipo e cor</span>
                </div>
              )}
              <InputField
                label="Peso da peça"
                value={peca.pesoGramas}
                onChange={(v) => updatePeca(peca.id, 'pesoGramas', v)}
                suffix="g"
                min={0}
                step={1}
              />
              <InputField
                label="Peso suporte/raft"
                value={peca.pesoSuporteGramas}
                onChange={(v) => updatePeca(peca.id, 'pesoSuporteGramas', v)}
                suffix="g"
                min={0}
                step={1}
              />
              <InputField
                label="Preço do filamento"
                value={peca.precoPorKg}
                onChange={(v) => updatePeca(peca.id, 'precoPorKg', v)}
                suffix="R$/kg"
                min={0}
                step={5}
              />
              <InputField
                label="Horas de impressão"
                value={peca.horasImpressao}
                onChange={(v) => updatePeca(peca.id, 'horasImpressao', v)}
                suffix="h"
                min={0}
                step={0.5}
              />
              {modo === 'rapido' && (
                <InputField
                  label="Desperdício"
                  value={inputs.desperdicioPercentual}
                  onChange={updateInput('desperdicioPercentual')}
                  suffix="%"
                  min={0}
                  max={100}
                  step={1}
                />
              )}
            </FormSection>
          </div>
        ))}

        {/* Add piece button */}
        <button className="add-peca-btn" onClick={addPeca}>
          + Adicionar outra peça ao orçamento
        </button>

        {/* Advanced mode: all cost fields */}
        {modo === 'avancado' && (
          <>
            <FormSection title="Impressora" icon="🖨️">
              <InputField
                label="Valor da impressora"
                value={inputs.valorImpressora}
                onChange={updateInput('valorImpressora')}
                suffix="R$"
                min={0}
                step={100}
              />
              <InputField
                label="Vida útil estimada"
                value={inputs.vidaUtilHoras}
                onChange={updateInput('vidaUtilHoras')}
                suffix="horas"
                min={1}
                step={100}
              />
              <InputField
                label="Manutenção por hora"
                value={inputs.manutencaoPorHora}
                onChange={updateInput('manutencaoPorHora')}
                suffix="R$/h"
                min={0}
                step={0.1}
              />
              <InputField
                label="Taxa de falha"
                value={inputs.taxaFalhaPercentual}
                onChange={updateInput('taxaFalhaPercentual')}
                suffix="%"
                min={0}
                max={90}
                step={1}
              />
            </FormSection>

            <FormSection title="Energia" icon="⚡">
              <InputField
                label="Potência da impressora"
                value={inputs.potenciaWatts}
                onChange={updateInput('potenciaWatts')}
                suffix="W"
                min={0}
                step={10}
              />
              <InputField
                label="Tarifa de energia"
                value={inputs.tarifaKwh}
                onChange={updateInput('tarifaKwh')}
                suffix="R$/kWh"
                min={0}
                step={0.01}
              />
            </FormSection>

            <FormSection title="Mão de obra" icon="👷">
              <InputField
                label="Horas de trabalho (setup)"
                value={inputs.horasTrabalho}
                onChange={updateInput('horasTrabalho')}
                suffix="h"
                min={0}
                step={0.25}
              />
              <InputField
                label="Valor da hora"
                value={inputs.valorHora}
                onChange={updateInput('valorHora')}
                suffix="R$/h"
                min={0}
                step={5}
              />
            </FormSection>

            <FormSection title="Custos Fixos" icon="📊">
              <InputField
                label="Custo fixo mensal"
                value={inputs.custoFixoMensal}
                onChange={updateInput('custoFixoMensal')}
                suffix="R$/mês"
                min={0}
                step={50}
              />
              <InputField
                label="Impressões por mês"
                value={inputs.impressoesPorMes}
                onChange={updateInput('impressoesPorMes')}
                suffix="peças"
                min={1}
                step={1}
              />
              <InputField
                label="Desperdício"
                value={inputs.desperdicioPercentual}
                onChange={updateInput('desperdicioPercentual')}
                suffix="%"
                min={0}
                max={100}
                step={1}
              />
            </FormSection>
          </>
        )}

        {/* Margem - always visible */}
        <FormSection title="Margem de Lucro" icon="💰">
          <InputField
            label="Margem de lucro"
            value={margemPercentual}
            onChange={setMargemPercentual}
            suffix="%"
            min={0}
            step={5}
          />
        </FormSection>

        {/* Custos Extras */}
        <FormSection title="Custos Extras (pós-processamento)" icon="🎨">
          <div style={{ gridColumn: '1 / -1' }}>
            {custosExtras.length > 0 && (
              <div className="extras-list">
                {custosExtras.map((extra, i) => (
                  <div key={i} className="extra-item">
                    <div className="input-wrapper" style={{ flex: 2 }}>
                      <input
                        type="text"
                        placeholder="Descrição (lixamento, pintura...)"
                        value={extra.nome}
                        onChange={(e) => updateCustoExtra(i, 'nome', e.target.value)}
                      />
                    </div>
                    <div className="input-wrapper" style={{ flex: 1 }}>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={extra.valor || ''}
                        onChange={(e) => updateCustoExtra(i, 'valor', parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.5}
                      />
                      <span className="input-suffix">R$</span>
                    </div>
                    <button className="extra-remove" onClick={() => removeCustoExtra(i)} title="Remover">✕</button>
                  </div>
                ))}
              </div>
            )}
            <button className="btn btn-sm btn-secondary" onClick={addCustoExtra}>
              + Adicionar custo extra
            </button>
            {totalExtras > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Total extras: <strong>R$ {totalExtras.toFixed(2)}</strong>
              </p>
            )}
          </div>
        </FormSection>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <button className="btn btn-primary" onClick={() => setShowSaveModal(true)}>
            💾 Salvar Orçamento
          </button>
          {onNavigateToHistory && (
            <button className="btn btn-secondary" onClick={onNavigateToHistory}>
              📋 Ver Histórico
            </button>
          )}
        </div>
        {saveMessage && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: saveMessage.includes('Erro') ? 'var(--danger)' : 'var(--success)' }}>
            {saveMessage}
          </p>
        )}
      </div>

      {/* Results panel */}
      <div className="calculator-results">
        {resultado && (
          <>
            <PricePanel
              precoMinimo={resultado.precoMinimo + totalExtras}
              precoIdeal={resultado.precoIdeal + totalExtras}
              precoPremium={resultado.precoPremium + totalExtras}
            />
            <CostVisualization
              breakdown={resultado.breakdown}
              margem={margemPercentual}
            />
            {totalExtras > 0 && (
              <div className="cost-visualization">
                <div className="cost-visualization-title">Custos Extras</div>
                {custosExtras.filter((e) => e.nome && e.valor > 0).map((e, i) => (
                  <div key={i} className="cost-bar-row">
                    <span className="cost-bar-label">{e.nome}</span>
                    <span className="cost-bar-value">R$ {e.valor.toFixed(2)}</span>
                  </div>
                ))}
                <div className="cost-bar-row" style={{ fontWeight: 700, marginTop: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '0.5rem' }}>
                  <span className="cost-bar-label">Total</span>
                  <span className="cost-bar-value">R$ {totalExtras.toFixed(2)}</span>
                </div>
              </div>
            )}
            {/* Multi-piece total */}
            {pecas.length > 1 && resultadosMulti.length === pecas.length && (
              <div className="total-card">
                <div className="total-card-label">Total Consolidado ({pecas.length} peças + extras)</div>
                <div className="total-card-value">R$ {totalMultiIdeal.toFixed(2)}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Salvar Orçamento</h3>
            {alertasEstoque.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                {alertasEstoque.map((a, i) => (
                  <div key={i} className="stock-alert">{a}</div>
                ))}
              </div>
            )}
            <input
              type="text"
              placeholder="Nome da peça (ex: Suporte GoPro)"
              value={nomePeca}
              onChange={(e) => setNomePeca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowSaveModal(false)}>
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!nomePeca.trim() || saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
