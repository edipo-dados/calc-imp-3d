import { z } from 'zod';

export const calculoInputSchema = z.object({
  pesoGramas: z.number().positive('Peso deve ser positivo'),
  precoPorKg: z.number().positive('Preço por kg deve ser positivo'),
  desperdicioPercentual: z.number().min(0).max(100, 'Desperdício deve ser entre 0 e 100%'),
  potenciaWatts: z.number().nonnegative('Potência não pode ser negativa'),
  horasImpressao: z.number().positive('Horas de impressão deve ser positivo'),
  tarifaKwh: z.number().nonnegative('Tarifa não pode ser negativa'),
  valorImpressora: z.number().positive('Valor da impressora deve ser positivo'),
  vidaUtilHoras: z.number().positive('Vida útil deve ser positiva'),
  manutencaoPorHora: z.number().nonnegative('Manutenção não pode ser negativa'),
  horasTrabalho: z.number().nonnegative('Horas de trabalho não pode ser negativa'),
  valorHora: z.number().nonnegative('Valor hora não pode ser negativo'),
  taxaFalhaPercentual: z.number().min(0).max(90, 'Taxa de falha máxima: 90%'),
  custoFixoMensal: z.number().nonnegative('Custo fixo não pode ser negativo'),
  impressoesPorMes: z.number().positive('Impressões por mês deve ser positivo'),
  margemPercentual: z.number().nonnegative('Margem não pode ser negativa'),
});

export type CalculoInput = z.infer<typeof calculoInputSchema>;

export interface CustoBreakdown {
  custoFilamento: number;
  custoEnergia: number;
  custoDepreciacao: number;
  custoManutencao: number;
  custoMaoDeObra: number;
  custoFixoRateado: number;
  subtotal: number;
  fatorFalha: number;
  custoComFalha: number;
}

export interface ResultadoCalculo {
  breakdown: CustoBreakdown;
  precoMinimo: number;
  precoIdeal: number;
  precoPremium: number;
}

export const orcamentoCreateSchema = z.object({
  nomePeca: z.string().min(1, 'Nome da peça é obrigatório'),
}).merge(calculoInputSchema);

export type OrcamentoCreateInput = z.infer<typeof orcamentoCreateSchema>;

// === Filamento schemas ===

export const filamentoCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo: z.string().optional().default('PLA'),
  cor: z.string().optional().default('Padrão'),
  precoPorKg: z.number().positive('Preço deve ser positivo'),
  densidade: z.number().positive().optional(),
  estoqueKg: z.number().nonnegative().optional().default(0),
  estoqueMinKg: z.number().nonnegative().optional().default(0.2),
});

export const filamentoUpdateSchema = filamentoCreateSchema.partial();

export const filamentoEstoqueSchema = z.object({
  pesoGramas: z.number().positive('Peso em gramas deve ser positivo'),
});

export type FilamentoCreateInput = z.infer<typeof filamentoCreateSchema>;

// === Impressora schemas ===

export const impressoraCreateSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  marca: z.string().optional().default(''),
  modelo: z.string().optional().default(''),
  potenciaWatts: z.number().nonnegative('Potência não pode ser negativa'),
  valorCompra: z.number().positive('Valor deve ser positivo'),
  vidaUtilHoras: z.number().positive('Vida útil deve ser positiva'),
  horasUsadas: z.number().nonnegative().optional().default(0),
  manutencaoPorHora: z.number().nonnegative().optional().default(0),
  taxaFalhaPercentual: z.number().min(0).max(90).optional().default(5),
  volumeMaxX: z.number().positive().optional(),
  volumeMaxY: z.number().positive().optional(),
  volumeMaxZ: z.number().positive().optional(),
  ativa: z.boolean().optional().default(true),
});

export const impressoraUpdateSchema = impressoraCreateSchema.partial();

export type ImpressoraCreateInput = z.infer<typeof impressoraCreateSchema>;

// === Projeção schema ===

export const projecaoInputSchema = z.object({
  horasUsoPorMes: z.number().positive('Horas de uso deve ser positivo'),
  potenciaWatts: z.number().nonnegative(),
  tarifaKwh: z.number().nonnegative(),
  valorImpressora: z.number().positive(),
  vidaUtilHoras: z.number().positive(),
  manutencaoPorHora: z.number().nonnegative(),
  custoFixoMensal: z.number().nonnegative(),
  horasMediaPorPeca: z.number().positive('Horas média por peça deve ser positivo'),
  custoMedioFilamentoPorPeca: z.number().nonnegative(),
  precoMedioVenda: z.number().positive('Preço médio de venda deve ser positivo'),
});

export type ProjecaoInput = z.infer<typeof projecaoInputSchema>;
