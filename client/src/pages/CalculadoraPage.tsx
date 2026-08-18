import { useState, useEffect, useCallback, useRef } from 'react';
import { api, CalculoInput, ResultadoCalculo, Filamento, Impressora } from '../api/client';
import { FormSection } from '../components/FormSection';
import { InputField } from '../components/InputField';
import { CostVisualization } from '../components/CostVisualization';
import { PricePanel } from '../components/PricePanel';

interface CalculadoraPageProps {
  initialValues?: Partial<CalculoInput>;
  onNavigateToHistory?: () => void;
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

export function CalculadoraPage({ initialValues, onNavigateToHistory }: CalculadoraPageProps) {
  const [inputs, setInputs] = useState<CalculoInput>({ ...DEFAULT_VALUES, ...initialValues });
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null);
  const [filamentos, setFilamentos] = useState<Filamento[]>([]);
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [nomePeca, setNomePeca] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load filamentos e impressoras
  useEffect(() => {
    api.listarFilamentos().then(setFilamentos).catch(console.error);
    api.listarImpressoras().then((imps) => {
      setImpressoras(imps.filter((i) => i.ativa));
    }).catch(console.error);
  }, []);

  // Auto-fill from first impressora if available
  useEffect(() => {
    if (impressoras.length > 0 && !initialValues) {
      const imp = impressoras[0];
      setInputs((prev) => ({
        ...prev,
        potenciaWatts: imp.potenciaWatts,
        valorImpressora: imp.valorCompra,
        vidaUtilHoras: imp.vidaUtilHoras,
        manutencaoPorHora: imp.manutencaoPorHora,
        taxaFalhaPercentual: imp.taxaFalhaPercentual,
      }));
    }
  }, [impressoras, initialValues]);

  // Auto-fill from first filamento if available
  useEffect(() => {
    if (filamentos.length > 0 && !initialValues) {
      const fil = filamentos[0];
      setInputs((prev) => ({
        ...prev,
        precoPorKg: fil.precoPorKg,
      }));
    }
  }, [filamentos, initialValues]);

  // Apply initialValues when they change (duplicate feature)
  useEffect(() => {
    if (initialValues) {
      setInputs({ ...DEFAULT_VALUES, ...initialValues });
    }
  }, [initialValues]);

  // Debounced calculation
  const calcular = useCallback((data: CalculoInput) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.calcular(data);
        setResultado(result);
      } catch (err) {
        console.error('Erro ao calcular:', err);
      }
    }, 300);
  }, []);

  // Trigger calculation on input change
  useEffect(() => {
    calcular(inputs);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputs, calcular]);

  const updateInput = (field: keyof CalculoInput) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilamentoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const filamento = filamentos.find((f) => f.id === id);
    if (filamento) {
      setInputs((prev) => ({ ...prev, precoPorKg: filamento.precoPorKg }));
    }
  };

  const handleImpressoraSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = parseInt(e.target.value);
    const imp = impressoras.find((i) => i.id === id);
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
  };

  const handleSave = async () => {
    if (!nomePeca.trim()) return;
    setSaving(true);
    try {
      await api.salvarOrcamento({ ...inputs, nomePeca: nomePeca.trim() });
      setSaveMessage('Orçamento salvo com sucesso!');
      setShowSaveModal(false);
      setNomePeca('');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Erro ao salvar:', err);
      setSaveMessage('Erro ao salvar orçamento');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="calculator-layout">
      <div className="calculator-form">
        {/* Impressora selector */}
        <FormSection title="Impressora" icon="🖨️">
          {impressoras.length > 0 && (
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Selecionar impressora cadastrada</label>
              <div className="select-wrapper">
                <select onChange={handleImpressoraSelect} defaultValue="">
                  <option value="" disabled>
                    Selecione uma impressora...
                  </option>
                  {impressoras.map((imp) => (
                    <option key={imp.id} value={imp.id}>
                      {imp.nome} {imp.marca && `(${imp.marca})`} — {imp.potenciaWatts}W
                    </option>
                  ))}
                </select>
              </div>
              <span className="input-hint">Preenche automaticamente: potência, valor, vida útil, manutenção e taxa de falha</span>
            </div>
          )}
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

        {/* Filamento */}
        <FormSection title="Filamento" icon="🧵">
          {filamentos.length > 0 && (
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Selecionar filamento cadastrado</label>
              <div className="select-wrapper">
                <select onChange={handleFilamentoSelect} defaultValue="">
                  <option value="" disabled>
                    Selecione um filamento...
                  </option>
                  {filamentos.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} ({f.tipo} {f.cor}) — R$ {f.precoPorKg.toFixed(2)}/kg {f.estoqueKg < f.estoqueMinKg ? '⚠️' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <span className="input-hint">Preenche automaticamente o preço por kg</span>
            </div>
          )}
          <InputField
            label="Peso da peça"
            value={inputs.pesoGramas}
            onChange={updateInput('pesoGramas')}
            suffix="g"
            min={0}
            step={1}
          />
          <InputField
            label="Preço do filamento"
            value={inputs.precoPorKg}
            onChange={updateInput('precoPorKg')}
            suffix="R$/kg"
            min={0}
            step={5}
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

        {/* Energia */}
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
            label="Horas de impressão"
            value={inputs.horasImpressao}
            onChange={updateInput('horasImpressao')}
            suffix="h"
            min={0}
            step={0.5}
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

        {/* Mão de obra */}
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

        {/* Custos fixos & Margem */}
        <FormSection title="Custos Fixos & Margem" icon="📊">
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
            label="Margem de lucro"
            value={inputs.margemPercentual}
            onChange={updateInput('margemPercentual')}
            suffix="%"
            min={0}
            step={5}
          />
        </FormSection>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--success)' }}>
            {saveMessage}
          </p>
        )}
      </div>

      {/* Results panel */}
      <div className="calculator-results">
        {resultado && (
          <>
            <PricePanel
              precoMinimo={resultado.precoMinimo}
              precoIdeal={resultado.precoIdeal}
              precoPremium={resultado.precoPremium}
            />
            <CostVisualization
              breakdown={resultado.breakdown}
              margem={inputs.margemPercentual}
            />
          </>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Salvar Orçamento</h3>
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
              <button
                className="btn btn-secondary"
                onClick={() => setShowSaveModal(false)}
              >
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
