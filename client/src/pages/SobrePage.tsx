export function SobrePage() {
  return (
    <div className="sobre-page">
      <h1 className="sobre-title">📘 Sobre a Calculadora 3D</h1>
      <p className="sobre-subtitle">
        Sistema completo de precificação para impressão 3D. Calcule custos reais, gerencie estoque de filamentos e acompanhe a rentabilidade do seu negócio.
      </p>

      <div className="sobre-sections">
        {/* Calculadora */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">🧮</span>
            <h2>Calculadora</h2>
          </div>
          <p>Ferramenta principal de precificação. Calcula o preço de venda de uma peça impressa em 3D considerando todos os custos envolvidos:</p>
          <ul>
            <li><strong>Material</strong> — peso da peça + suporte/raft × preço do filamento por kg, com percentual de desperdício</li>
            <li><strong>Energia</strong> — potência da impressora × horas de impressão × tarifa elétrica</li>
            <li><strong>Depreciação</strong> — valor da impressora ÷ vida útil × horas usadas na peça</li>
            <li><strong>Manutenção</strong> — custo de manutenção por hora × horas de impressão</li>
            <li><strong>Mão de obra</strong> — horas de setup/preparação × valor da hora</li>
            <li><strong>Custo fixo rateado</strong> — custo fixo mensal (aluguel, internet, softwares) dividido pelo número de peças impressas por mês</li>
            <li><strong>Taxa de falha</strong> — percentual aplicado sobre o subtotal para cobrir reimpressões</li>
            <li><strong>Custos extras</strong> — pós-processamento (lixamento, pintura, montagem), embalagem, frete</li>
            <li><strong>Margem de lucro</strong> — aplicada sobre tudo acima, gerando 3 faixas de preço:</li>
          </ul>
          <div className="sobre-price-explanation">
            <div className="sobre-price-item minimo">
              <strong>Preço Mínimo</strong> — margem reduzida (para peças simples ou clientes recorrentes)
            </div>
            <div className="sobre-price-item ideal">
              <strong>Preço Ideal</strong> — margem padrão configurada (uso normal)
            </div>
            <div className="sobre-price-item premium">
              <strong>Preço Premium</strong> — margem elevada (peças complexas, prazo apertado, personalização)
            </div>
          </div>
          <h3>Modos de uso</h3>
          <ul>
            <li><strong>⚡ Modo Rápido</strong> — para o dia a dia. Selecione a impressora, o filamento, informe peso e horas. Os demais parâmetros vêm do perfil de custos.</li>
            <li><strong>🔧 Modo Avançado</strong> — exibe todos os campos para sobrescrever valores específicos de um orçamento.</li>
          </ul>
          <h3>Multi-peça</h3>
          <p>Permite adicionar várias peças (com filamentos diferentes) no mesmo orçamento, com total consolidado.</p>
        </section>

        {/* Histórico */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">📋</span>
            <h2>Histórico</h2>
          </div>
          <p>Registro de todos os orçamentos salvos. Permite:</p>
          <ul>
            <li>Buscar orçamentos por nome da peça</li>
            <li>Ver a composição detalhada de custo de cada peça</li>
            <li>Duplicar um orçamento anterior para recalcular com ajustes</li>
            <li>Excluir orçamentos antigos</li>
          </ul>
        </section>

        {/* Cadastro */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">📦</span>
            <h2>Cadastro</h2>
          </div>
          <p>Gerenciamento dos recursos usados na impressão:</p>
          <h3>🧵 Filamentos</h3>
          <ul>
            <li>Cadastro com nome, tipo (PLA, PETG, ABS...), cor e preço por kg</li>
            <li>Controle de estoque em kg com alerta de estoque mínimo</li>
            <li>Função de abastecimento quando chega material novo</li>
            <li>Baixa automática do estoque ao salvar um orçamento</li>
          </ul>
          <h3>🖨️ Impressoras</h3>
          <ul>
            <li>Cadastro com potência, valor de compra, vida útil, manutenção por hora, taxa de falha</li>
            <li>Controle de horas usadas vs. vida útil restante</li>
            <li>Volume máximo de impressão</li>
            <li>Status ativa/inativa</li>
          </ul>
          <h3>⚙️ Perfis de Custos</h3>
          <ul>
            <li>Configuração única dos parâmetros que não mudam a cada orçamento</li>
            <li>Inclui: tarifa de energia, horas de setup, valor da hora, custo fixo mensal, impressões por mês, desperdício</li>
            <li>Suporta múltiplos perfis (ex: "FDM Ender 3", "Resina Elegoo")</li>
            <li>O perfil ativo é carregado automaticamente no modo rápido da Calculadora</li>
          </ul>
        </section>

        {/* Projeção */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">📈</span>
            <h2>Projeção</h2>
          </div>
          <p>Simulação de rentabilidade mensal do seu negócio de impressão 3D:</p>
          <ul>
            <li>Estimativa de custos mensais (energia, depreciação, manutenção, fixos, filamento)</li>
            <li>Estimativa de receita baseada no preço médio de venda</li>
            <li>Lucro estimado por mês</li>
            <li>Ponto de equilíbrio — quantas peças precisa vender para cobrir os custos fixos</li>
          </ul>
        </section>

        {/* Admin */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">👑</span>
            <h2>Admin</h2>
          </div>
          <p>Área restrita a administradores para gerenciar acessos:</p>
          <ul>
            <li>Aprovar ou rejeitar novos cadastros de usuários</li>
            <li>Visualizar todos os usuários e seus papéis</li>
            <li>O sistema exige aprovação do admin para novos usuários acessarem</li>
          </ul>
        </section>

        {/* Fórmula */}
        <section className="sobre-card">
          <div className="sobre-card-header">
            <span className="sobre-card-icon">🔢</span>
            <h2>Fórmula de Cálculo</h2>
          </div>
          <div className="sobre-formula">
            <p><strong>Custo de Material</strong> = (peso peça + suporte) ÷ 1000 × preço/kg × (1 + desperdício%)</p>
            <p><strong>Custo de Energia</strong> = (potência W ÷ 1000) × horas impressão × tarifa R$/kWh</p>
            <p><strong>Depreciação</strong> = (valor impressora ÷ vida útil horas) × horas impressão</p>
            <p><strong>Manutenção</strong> = manutenção R$/hora × horas impressão</p>
            <p><strong>Mão de obra</strong> = horas setup × valor hora</p>
            <p><strong>Custo fixo</strong> = custo fixo mensal ÷ impressões por mês</p>
            <p><strong>Subtotal</strong> = soma de todos acima</p>
            <p><strong>Com falha</strong> = subtotal × (1 ÷ (1 - taxa falha%))</p>
            <p><strong>Preço Ideal</strong> = com falha × (1 + margem%)</p>
            <p><strong>Preço Mínimo</strong> = com falha × (1 + max(margem - 25%, 5%))</p>
            <p><strong>Preço Premium</strong> = com falha × (1 + margem% + 40%)</p>
          </div>
        </section>
      </div>

      <footer className="sobre-footer">
        <p>Calculadora 3D v1.0 — Ferramenta de precificação para impressão 3D</p>
      </footer>
    </div>
  );
}
