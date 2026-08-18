import { useState, useEffect, useCallback, useRef } from 'react';
import { api, ProjecaoInput, ProjecaoMensal } from '../api/client';
import { FormSection } from '../components/FormSection';
import { InputField } from '../components/InputField';

const DEFAULT_PROJECAO: ProjecaoInput = {
  horasUsoPorMes: 150,
  potenciaWatts: 200,
  tarifaKwh: 0.85,
  valorImpressora: 3000,
  vidaUtilHoras: 5000,
  manutencaoPorHora: 0.50,
  custoFixoMensal: 500,
  horasMediaPorPeca: 3,
  custoMedioFilamentoPorPeca: 8,
  precoMedioVenda: 45,
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function ProjecaoPage() {
  const [inputs, setInputs] = useState<ProjecaoInput>(DEFAULT_PROJECAO);
  const [resultado, setResultado] = useState<ProjecaoMensal | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calcular = useCallback((data: ProjecaoInput) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await api.calcularProjecao(data);
        setResultado(result);
      } catch (err) {
        console.error('Erro ao calcular projeção:', err);
      }
    }, 300);
  }, []);

  useEffect(() => {
    calcular(inputs);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [inputs, calcular]);

  const updateInput = (field: keyof ProjecaoInput) => (value: number) => {
    setInputs((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="calculator-layout">
      <div className="calculator-form">
        <FormSection title="Uso Mensal" icon="📅">
          <InputField
            label="Horas de uso por mês"
            value={inputs.horasUsoPorMes}
            onChange={updateInput('horasUsoPorMes')}
            suffix="h/mês"
            min={1}
            step={10}
          />
          <InputField
            label="Horas média por peça"
            value={inputs.horasMediaPorPeca}
            onChange={updateInput('horasMediaPorPeca')}
            suffix="h"
            min={0.1}
            step={0.5}
          />
        </FormSection>

        <FormSection title="Custos da Máquina" icon="🔧">
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
        </FormSection>

        <FormSection title="Custos & Receita" icon="💰">
          <InputField
            label="Custo fixo mensal"
            value={inputs.custoFixoMensal}
            onChange={updateInput('custoFixoMensal')}
            suffix="R$/mês"
            min={0}
            step={50}
          />
          <InputField
            label="Custo médio filamento/peça"
            value={inputs.custoMedioFilamentoPorPeca}
            onChange={updateInput('custoMedioFilamentoPorPeca')}
            suffix="R$"
            min={0}
            step={1}
          />
          <InputField
            label="Preço médio de venda"
            value={inputs.precoMedioVenda}
            onChange={updateInput('precoMedioVenda')}
            suffix="R$"
            min={0}
            step={5}
          />
        </FormSection>
      </div>

      <div className="calculator-results">
        {resultado && (
          <div className="projecao-results">
            {/* Monthly Cost Breakdown */}
            <div className="projecao-card">
              <div className="projecao-card-title">Custos Mensais</div>
              <div className="projecao-breakdown">
                <div className="projecao-row">
                  <span>⚡ Energia</span>
                  <span className="mono">{formatCurrency(resultado.custoEnergiaMes)}</span>
                </div>
                <div className="projecao-row">
                  <span>📉 Depreciação</span>
                  <span className="mono">{formatCurrency(resultado.custoDepreciacaoMes)}</span>
                </div>
                <div className="projecao-row">
                  <span>🔧 Manutenção</span>
                  <span className="mono">{formatCurrency(resultado.custoManutencaoMes)}</span>
                </div>
                <div className="projecao-row">
                  <span>🏢 Custo fixo</span>
                  <span className="mono">{formatCurrency(resultado.custoFixoMes)}</span>
                </div>
                <div className="projecao-row">
                  <span>🧵 Filamento total</span>
                  <span className="mono">{formatCurrency(resultado.custoFilamentoTotalMes)}</span>
                </div>
                <div className="projecao-row projecao-total">
                  <span>Custo Total</span>
                  <span className="mono">{formatCurrency(resultado.custoTotalMes)}</span>
                </div>
              </div>
            </div>

            {/* Production */}
            <div className="projecao-card">
              <div className="projecao-card-title">Produção Estimada</div>
              <div className="projecao-stat">
                <div className="projecao-stat-value">{resultado.pecasEstimadas}</div>
                <div className="projecao-stat-label">peças/mês</div>
              </div>
            </div>

            {/* Revenue & Profit */}
            <div className="projecao-card">
              <div className="projecao-card-title">Receita & Lucro</div>
              <div className="projecao-breakdown">
                <div className="projecao-row">
                  <span>Receita estimada</span>
                  <span className="mono">{formatCurrency(resultado.receitaEstimada)}</span>
                </div>
                <div className={`projecao-row projecao-profit ${resultado.lucroEstimado >= 0 ? 'positive' : 'negative'}`}>
                  <span>Lucro estimado</span>
                  <span className="mono">{formatCurrency(resultado.lucroEstimado)}</span>
                </div>
              </div>
            </div>

            {/* Break-even */}
            <div className="projecao-card projecao-breakeven">
              <div className="projecao-card-title">Ponto de Equilíbrio</div>
              <div className="projecao-stat">
                <div className="projecao-stat-value">
                  {resultado.pontoEquilibrio === -1 ? '∞' : resultado.pontoEquilibrio}
                </div>
                <div className="projecao-stat-label">
                  {resultado.pontoEquilibrio === -1
                    ? 'Margem insuficiente para cobrir custos fixos'
                    : 'peças para cobrir custos fixos'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
