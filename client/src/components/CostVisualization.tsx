import { CustoBreakdown } from '../api/client';

interface CostVisualizationProps {
  breakdown: CustoBreakdown;
  margem: number;
}

interface CostItem {
  label: string;
  value: number;
  color: string;
}

export function CostVisualization({ breakdown, margem }: CostVisualizationProps) {
  const items: CostItem[] = [
    { label: 'Filamento', value: breakdown.custoFilamento, color: 'var(--cost-filamento)' },
    { label: 'Energia', value: breakdown.custoEnergia, color: 'var(--cost-energia)' },
    { label: 'Depreciação', value: breakdown.custoDepreciacao, color: 'var(--cost-depreciacao)' },
    { label: 'Manutenção', value: breakdown.custoManutencao, color: 'var(--cost-manutencao)' },
    { label: 'Mão de obra', value: breakdown.custoMaoDeObra, color: 'var(--cost-mao-de-obra)' },
    { label: 'Custo fixo', value: breakdown.custoFixoRateado, color: 'var(--cost-fixo)' },
  ];

  const custoFalhaExtra = breakdown.custoComFalha - breakdown.subtotal;
  if (custoFalhaExtra > 0) {
    items.push({ label: 'Falhas', value: custoFalhaExtra, color: 'var(--cost-falha)' });
  }

  const valorMargem = breakdown.custoComFalha * (margem / 100);
  if (valorMargem > 0) {
    items.push({ label: 'Margem', value: valorMargem, color: 'var(--cost-margem)' });
  }

  const total = items.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...items.map((i) => i.value));

  return (
    <div className="cost-visualization">
      <div className="cost-visualization-title">Composição do Custo</div>

      {/* Stacked horizontal bar */}
      {total > 0 && (
        <div className="stacked-bar" role="img" aria-label="Barra de custos empilhados">
          {items.map((item) => (
            <div
              key={item.label}
              className="stacked-bar-segment"
              style={{
                width: `${(item.value / total) * 100}%`,
                backgroundColor: item.color,
              }}
              title={`${item.label}: R$ ${item.value.toFixed(2)}`}
            />
          ))}
        </div>
      )}

      {/* Individual bars */}
      <div className="cost-bar-container">
        {items.map((item) => (
          <div key={item.label} className="cost-bar-row">
            <span className="cost-bar-label">{item.label}</span>
            <div className="cost-bar-track">
              <div
                className="cost-bar-fill"
                style={{
                  width: maxValue > 0 ? `${(item.value / maxValue) * 100}%` : '0%',
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="cost-bar-value mono">
              R$ {item.value.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="cost-legend">
        {items.map((item) => (
          <div key={item.label} className="cost-legend-item">
            <div className="cost-legend-color" style={{ backgroundColor: item.color }} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
