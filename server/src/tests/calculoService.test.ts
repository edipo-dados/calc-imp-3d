import { describe, it, expect } from 'vitest';
import { calcularPreco, calcularPrecoReverso } from '../services/calculoService';
import { CalculoInput } from '../schemas/calculoInput.schema';

const baseInput: CalculoInput = {
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

describe('calcularPreco', () => {
  it('should calculate all costs correctly for base input', () => {
    const result = calcularPreco(baseInput);
    expect(result.breakdown.custoFilamento).toBeCloseTo(6.30, 2);
    expect(result.breakdown.custoEnergia).toBeCloseTo(0.51, 2);
    expect(result.breakdown.custoDepreciacao).toBeCloseTo(1.80, 2);
    expect(result.breakdown.custoManutencao).toBeCloseTo(1.50, 2);
    expect(result.breakdown.custoMaoDeObra).toBeCloseTo(25.00, 2);
    expect(result.breakdown.custoFixoRateado).toBeCloseTo(16.67, 2);
  });

  it('should ensure precoMinimo <= precoIdeal <= precoPremium', () => {
    const result = calcularPreco(baseInput);
    expect(result.precoMinimo).toBeLessThanOrEqual(result.precoIdeal);
    expect(result.precoIdeal).toBeLessThanOrEqual(result.precoPremium);
  });

  it('should handle taxaFalhaPercentual = 0', () => {
    const input = { ...baseInput, taxaFalhaPercentual: 0 };
    const result = calcularPreco(input);
    expect(result.breakdown.fatorFalha).toBe(1);
    expect(result.breakdown.custoComFalha).toBe(result.breakdown.subtotal);
  });

  it('should handle taxaFalhaPercentual = 90 (fatorFalha = 10)', () => {
    const input = { ...baseInput, taxaFalhaPercentual: 90 };
    const result = calcularPreco(input);
    expect(result.breakdown.fatorFalha).toBeCloseTo(10, 1);
    expect(result.breakdown.custoComFalha).toBeCloseTo(result.breakdown.subtotal * 10, 2);
  });

  it('should handle zero labor and fixed costs', () => {
    const input = { ...baseInput, horasTrabalho: 0, custoFixoMensal: 0 };
    const result = calcularPreco(input);
    expect(result.breakdown.custoMaoDeObra).toBe(0);
    expect(result.breakdown.custoFixoRateado).toBe(0);
    expect(result.breakdown.subtotal).toBeGreaterThan(0);
  });

  it('should produce non-negative costs for valid inputs', () => {
    const result = calcularPreco(baseInput);
    expect(result.breakdown.custoFilamento).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.custoEnergia).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.custoDepreciacao).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.custoManutencao).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.custoMaoDeObra).toBeGreaterThanOrEqual(0);
    expect(result.breakdown.custoFixoRateado).toBeGreaterThanOrEqual(0);
  });
});

describe('calcularPrecoReverso', () => {
  it('should return correct margin for given price', () => {
    const result = calcularPreco(baseInput);
    const { margemPercentual, ...inputSemMargem } = baseInput;
    const margem = calcularPrecoReverso(inputSemMargem, result.precoIdeal);
    expect(margem).toBeCloseTo(margemPercentual, 1);
  });

  it('should return negative margin for price below cost', () => {
    const { margemPercentual, ...inputSemMargem } = baseInput;
    const margem = calcularPrecoReverso(inputSemMargem, 1);
    expect(margem).toBeLessThan(0);
  });
});
