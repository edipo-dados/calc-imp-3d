import { CalculoInput, ResultadoCalculo } from '../schemas/calculoInput.schema';

export function calcularPreco(input: CalculoInput): ResultadoCalculo {
  const custoFilamento = (input.pesoGramas / 1000) * input.precoPorKg * (1 + input.desperdicioPercentual / 100);
  const custoEnergia = (input.potenciaWatts / 1000) * input.horasImpressao * input.tarifaKwh;
  const custoDepreciacao = (input.valorImpressora / input.vidaUtilHoras) * input.horasImpressao;
  const custoManutencao = input.manutencaoPorHora * input.horasImpressao;
  const custoMaoDeObra = input.horasTrabalho * input.valorHora;
  const custoFixoRateado = input.custoFixoMensal / input.impressoesPorMes;

  const subtotal = custoFilamento + custoEnergia + custoDepreciacao + custoManutencao + custoMaoDeObra + custoFixoRateado;

  const fatorFalha = 1 / (1 - input.taxaFalhaPercentual / 100);
  const custoComFalha = subtotal * fatorFalha;

  const precoIdeal = custoComFalha * (1 + input.margemPercentual / 100);
  const margemMinima = Math.max(input.margemPercentual - 25, 5);
  const precoMinimo = custoComFalha * (1 + margemMinima / 100);
  const precoPremium = custoComFalha * (1 + (input.margemPercentual + 40) / 100);

  return {
    breakdown: { custoFilamento, custoEnergia, custoDepreciacao, custoManutencao, custoMaoDeObra, custoFixoRateado, subtotal, fatorFalha, custoComFalha },
    precoMinimo,
    precoIdeal,
    precoPremium,
  };
}

export function calcularPrecoReverso(input: Omit<CalculoInput, 'margemPercentual'>, precoDesejado: number): number {
  const inputComMargem = { ...input, margemPercentual: 0 };
  const resultado = calcularPreco(inputComMargem);
  const custoComFalha = resultado.breakdown.custoComFalha;
  return ((precoDesejado / custoComFalha) - 1) * 100;
}

// === Projeção Mensal ===

export interface ProjecaoInput {
  horasUsoPorMes: number;
  potenciaWatts: number;
  tarifaKwh: number;
  valorImpressora: number;
  vidaUtilHoras: number;
  manutencaoPorHora: number;
  custoFixoMensal: number;
  horasMediaPorPeca: number;
  custoMedioFilamentoPorPeca: number;
  precoMedioVenda: number;
}

export interface ProjecaoMensal {
  custoEnergiaMes: number;
  custoDepreciacaoMes: number;
  custoManutencaoMes: number;
  custoFixoMes: number;
  custoTotalMes: number;
  pecasEstimadas: number;
  custoFilamentoTotalMes: number;
  receitaEstimada: number;
  lucroEstimado: number;
  pontoEquilibrio: number;
}

export function calcularProjecaoMensal(input: ProjecaoInput): ProjecaoMensal {
  const custoEnergiaMes = (input.potenciaWatts / 1000) * input.horasUsoPorMes * input.tarifaKwh;
  const custoDepreciacaoMes = (input.valorImpressora / input.vidaUtilHoras) * input.horasUsoPorMes;
  const custoManutencaoMes = input.manutencaoPorHora * input.horasUsoPorMes;
  const custoFixoMes = input.custoFixoMensal;

  const pecasEstimadas = Math.floor(input.horasUsoPorMes / input.horasMediaPorPeca);
  const custoFilamentoTotalMes = pecasEstimadas * input.custoMedioFilamentoPorPeca;

  const custoTotalMes = custoEnergiaMes + custoDepreciacaoMes + custoManutencaoMes + custoFixoMes + custoFilamentoTotalMes;
  const receitaEstimada = pecasEstimadas * input.precoMedioVenda;
  const lucroEstimado = receitaEstimada - custoTotalMes;

  // Break-even: custos fixos do mês / (preço venda - custo variável por peça)
  const custoVariavelPorPeca = input.custoMedioFilamentoPorPeca +
    ((input.potenciaWatts / 1000) * input.horasMediaPorPeca * input.tarifaKwh) +
    (input.manutencaoPorHora * input.horasMediaPorPeca) +
    ((input.valorImpressora / input.vidaUtilHoras) * input.horasMediaPorPeca);

  const margemPorPeca = input.precoMedioVenda - custoVariavelPorPeca;
  const pontoEquilibrio = margemPorPeca > 0 ? Math.ceil(custoFixoMes / margemPorPeca) : Infinity;

  return {
    custoEnergiaMes,
    custoDepreciacaoMes,
    custoManutencaoMes,
    custoFixoMes,
    custoTotalMes,
    pecasEstimadas,
    custoFilamentoTotalMes,
    receitaEstimada,
    lucroEstimado,
    pontoEquilibrio: pontoEquilibrio === Infinity ? -1 : pontoEquilibrio,
  };
}
