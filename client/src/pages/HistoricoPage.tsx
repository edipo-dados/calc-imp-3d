import { useState, useEffect } from 'react';
import { api, Orcamento, CalculoInput } from '../api/client';

interface HistoricoPageProps {
  onDuplicate: (inputs: CalculoInput) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoricoPage({ onDuplicate }: HistoricoPageProps) {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      const data = await api.listarOrcamentos();
      setOrcamentos(data);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.deletarOrcamento(id);
      setOrcamentos((prev) => prev.filter((o) => o.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const filteredOrcamentos = orcamentos.filter((o) =>
    o.nomePeca.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Carregando histórico...</div>;
  }

  return (
    <div className="history-page">
      <div className="history-search">
        <input
          type="text"
          placeholder="🔍 Buscar por nome da peça..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Buscar orçamentos"
        />
      </div>

      {filteredOrcamentos.length === 0 ? (
        <div className="history-empty">
          {search
            ? `Nenhum orçamento encontrado para "${search}"`
            : 'Nenhum orçamento salvo ainda. Faça um cálculo e salve!'}
        </div>
      ) : (
        <div className="history-list">
          {filteredOrcamentos.map((orc) => (
            <div
              key={orc.id}
              className="history-item"
              onClick={() => setExpandedId(expandedId === orc.id ? null : orc.id)}
            >
              <div className="history-item-header">
                <div>
                  <div className="history-item-name">{orc.nomePeca}</div>
                  <div className="history-item-date">{formatDate(orc.createdAt)}</div>
                </div>
                <div className="history-item-price">
                  {formatCurrency(orc.precoIdeal)}
                </div>
              </div>

              {expandedId === orc.id && (
                <div className="history-item-details">
                  <dl className="history-item-breakdown">
                    <dt>Filamento</dt>
                    <dd>{formatCurrency(orc.breakdown.custoFilamento)}</dd>
                    <dt>Energia</dt>
                    <dd>{formatCurrency(orc.breakdown.custoEnergia)}</dd>
                    <dt>Depreciação</dt>
                    <dd>{formatCurrency(orc.breakdown.custoDepreciacao)}</dd>
                    <dt>Manutenção</dt>
                    <dd>{formatCurrency(orc.breakdown.custoManutencao)}</dd>
                    <dt>Mão de obra</dt>
                    <dd>{formatCurrency(orc.breakdown.custoMaoDeObra)}</dd>
                    <dt>Custo fixo</dt>
                    <dd>{formatCurrency(orc.breakdown.custoFixoRateado)}</dd>
                    <dt>Subtotal</dt>
                    <dd>{formatCurrency(orc.breakdown.subtotal)}</dd>
                    <dt>Com falha</dt>
                    <dd>{formatCurrency(orc.breakdown.custoComFalha)}</dd>
                  </dl>

                  <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <span>Mínimo: <strong className="mono">{formatCurrency(orc.precoMinimo)}</strong></span>
                    <span>Ideal: <strong className="mono">{formatCurrency(orc.precoIdeal)}</strong></span>
                    <span>Premium: <strong className="mono">{formatCurrency(orc.precoPremium)}</strong></span>
                  </div>

                  <div className="history-item-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(orc.inputs);
                      }}
                    >
                      📋 Duplicar
                    </button>
                    {confirmDeleteId === orc.id ? (
                      <>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(orc.id);
                          }}
                        >
                          Confirmar exclusão
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(orc.id);
                        }}
                      >
                        🗑️ Excluir
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
