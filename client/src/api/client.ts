const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      headers,
      ...options,
    });
  } catch (networkError) {
    throw { error: 'Erro de conexão com o servidor. Verifique sua internet.' };
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw err;
  }
  return res.json();
}

// === Interfaces ===

export interface CalculoInput {
  pesoGramas: number;
  precoPorKg: number;
  desperdicioPercentual: number;
  potenciaWatts: number;
  horasImpressao: number;
  tarifaKwh: number;
  valorImpressora: number;
  vidaUtilHoras: number;
  manutencaoPorHora: number;
  horasTrabalho: number;
  valorHora: number;
  taxaFalhaPercentual: number;
  custoFixoMensal: number;
  impressoesPorMes: number;
  margemPercentual: number;
}

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

export interface Orcamento {
  id: number;
  nomePeca: string;
  inputs: CalculoInput;
  breakdown: CustoBreakdown;
  precoMinimo: number;
  precoIdeal: number;
  precoPremium: number;
  createdAt: string;
}

export interface Filamento {
  id: number;
  nome: string;
  tipo: string;
  cor: string;
  precoPorKg: number;
  densidade?: number;
  estoqueKg: number;
  estoqueMinKg: number;
  createdAt: string;
  updatedAt: string;
}

export interface Impressora {
  id: number;
  nome: string;
  marca: string;
  modelo: string;
  potenciaWatts: number;
  valorCompra: number;
  vidaUtilHoras: number;
  horasUsadas: number;
  manutencaoPorHora: number;
  taxaFalhaPercentual: number;
  volumeMaxX?: number;
  volumeMaxY?: number;
  volumeMaxZ?: number;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export interface UsuarioInfo {
  id: number;
  nome: string;
  email: string;
  role: string;
}

// === API ===

export const api = {
  // Auth
  login: (email: string, senha: string) =>
    request<{ token: string; usuario: UsuarioInfo }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    }),

  registrar: (nome: string, email: string, senha: string) =>
    request<{ message: string; usuario: UsuarioInfo }>('/auth/registrar', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    }),

  getMe: () => request<UsuarioInfo>('/auth/me'),

  listarPendentes: () =>
    request<{ id: number; nome: string; email: string; createdAt: string }[]>('/auth/pendentes'),

  aprovarUsuario: (id: number) =>
    request<{ message: string }>(`/auth/aprovar/${id}`, { method: 'POST' }),

  rejeitarUsuario: (id: number) =>
    request<{ message: string }>(`/auth/rejeitar/${id}`, { method: 'POST' }),

  listarUsuarios: () =>
    request<{ id: number; nome: string; email: string; role: string; createdAt: string }[]>('/auth/usuarios'),

  // Cálculos
  calcular: (input: CalculoInput) =>
    request<ResultadoCalculo>('/orcamentos/calcular', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  // Orçamentos
  salvarOrcamento: (data: CalculoInput & { nomePeca: string }) =>
    request<Orcamento>('/orcamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listarOrcamentos: () => request<Orcamento[]>('/orcamentos'),

  getOrcamento: (id: number) => request<Orcamento>(`/orcamentos/${id}`),

  deletarOrcamento: (id: number) =>
    request<void>(`/orcamentos/${id}`, { method: 'DELETE' }),

  // Filamentos
  listarFilamentos: () => request<Filamento[]>('/filamentos'),

  criarFilamento: (data: { nome: string; tipo?: string; cor?: string; precoPorKg: number; densidade?: number; estoqueKg?: number; estoqueMinKg?: number }) =>
    request<Filamento>('/filamentos', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  atualizarFilamento: (id: number, data: Partial<Filamento>) =>
    request<Filamento>(`/filamentos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletarFilamento: (id: number) =>
    request<void>(`/filamentos/${id}`, { method: 'DELETE' }),

  consumirFilamento: (id: number, pesoGramas: number) =>
    request<Filamento & { alertaEstoqueBaixo: boolean }>(`/filamentos/${id}/consumir`, {
      method: 'POST',
      body: JSON.stringify({ pesoGramas }),
    }),

  abastecerFilamento: (id: number, pesoGramas: number) =>
    request<Filamento>(`/filamentos/${id}/abastecer`, {
      method: 'POST',
      body: JSON.stringify({ pesoGramas }),
    }),

  // Impressoras
  listarImpressoras: () => request<Impressora[]>('/impressoras'),

  criarImpressora: (data: Omit<Impressora, 'id' | 'createdAt' | 'updatedAt'>) =>
    request<Impressora>('/impressoras', { method: 'POST', body: JSON.stringify(data) }),

  atualizarImpressora: (id: number, data: Partial<Impressora>) =>
    request<Impressora>(`/impressoras/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletarImpressora: (id: number) =>
    request<void>(`/impressoras/${id}`, { method: 'DELETE' }),

  // Projeção
  calcularProjecao: (input: ProjecaoInput) =>
    request<ProjecaoMensal>('/projecao', {
      method: 'POST',
      body: JSON.stringify(input),
    }),
};
