interface PricePanelProps {
  precoMinimo: number;
  precoIdeal: number;
  precoPremium: number;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function PricePanel({ precoMinimo, precoIdeal, precoPremium }: PricePanelProps) {
  return (
    <div className="price-panel">
      <div className="price-card minimo">
        <div className="price-card-label">Preço Mínimo</div>
        <div className="price-card-value">{formatCurrency(precoMinimo)}</div>
      </div>
      <div className="price-card ideal">
        <div className="price-card-label">Preço Ideal</div>
        <div className="price-card-value">{formatCurrency(precoIdeal)}</div>
      </div>
      <div className="price-card premium">
        <div className="price-card-label">Preço Premium</div>
        <div className="price-card-value">{formatCurrency(precoPremium)}</div>
      </div>
    </div>
  );
}
