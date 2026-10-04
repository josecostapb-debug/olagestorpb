import type {
  AdminMunicipality,
  AdminSecretary,
  AdminState,
  AdminUser,
  AuthUser,
  CreateEvaluationInput,
  Evaluation,
  EvaluationListResponse,
  EvaluationStats,
  Municipality,
  Secretary,
  State,
  StateWithDetails,
} from '../types/api'

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? '/api' : '/api')

interface ApiErrorBody {
  error?: string
  code?: string
}

export class ApiRequestError extends Error {
  code: string | undefined
  status: number

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.headers ?? {}),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
    },
  })

  const contentType = res.headers.get('content-type') ?? ''
  const body = contentType.includes('application/json')
    ? ((await res.json()) as T | ApiErrorBody)
    : null

  if (!res.ok) {
    const errBody = body as ApiErrorBody | null
    throw new ApiRequestError(errBody?.error ?? `Erro ${res.status}`, res.status, errBody?.code)
  }

  return body as T
}

function jsonInit(method: string, data: unknown): RequestInit {
  return { method, body: JSON.stringify(data) }
}

export const api = {
  // Catálogo público
  getStates: () => request<{ states: State[] }>('/states'),
  getMeta: () => request<{ states: StateWithDetails[] }>('/meta'),
  getMunicipalities: (stateCode: string) =>
    request<{ state: State; municipalities: Municipality[] }>(`/states/${stateCode}/municipalities`),
  getSecretaries: (stateCode: string) =>
    request<{ state: State; secretaries: Secretary[] }>(`/states/${stateCode}/secretaries`),

  // Avaliação
  createEvaluation: (input: CreateEvaluationInput) =>
    request<{ evaluation: Evaluation }>('/evaluations', jsonInit('POST', input)),
  getEvaluations: (params?: {
    stateId?: string
    municipalityId?: string
    feedbackType?: string
    page?: number
  }) => {
    const qs = new URLSearchParams()
    if (params?.stateId) qs.set('stateId', params.stateId)
    if (params?.municipalityId) qs.set('municipalityId', params.municipalityId)
    if (params?.feedbackType) qs.set('feedbackType', params.feedbackType)
    if (params?.page) qs.set('page', String(params.page))
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<EvaluationListResponse>(`/evaluations${suffix}`)
  },
  getEvaluationStats: (params?: { stateId?: string; municipalityId?: string }) => {
    const qs = new URLSearchParams()
    if (params?.stateId) qs.set('stateId', params.stateId)
    if (params?.municipalityId) qs.set('municipalityId', params.municipalityId)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    return request<EvaluationStats>(`/evaluations/stats${suffix}`)
  },

  // Auth
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/auth/login', jsonInit('POST', { email, password })),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/auth/me'),

  // Admin
  listUsers: () => request<{ users: AdminUser[] }>('/admin/users'),
  createUser: (data: Record<string, unknown>) =>
    request<{ user: AdminUser }>('/admin/users', jsonInit('POST', data)),
  updateUser: (id: string, data: Record<string, unknown>) =>
    request<{ user: AdminUser }>(`/admin/users/${id}`, jsonInit('PUT', data)),
  deleteUser: (id: string) => request<{ ok: boolean }>(`/admin/users/${id}`, { method: 'DELETE' }),

  listAdminStates: () => request<{ states: AdminState[] }>('/admin/states'),
  createAdminState: (data: { code: string; name: string; active?: boolean }) =>
    request<{ state: AdminState }>('/admin/states', jsonInit('POST', data)),
  updateAdminState: (id: string, data: { name?: string; active?: boolean }) =>
    request<{ state: AdminState }>(`/admin/states/${id}`, jsonInit('PUT', data)),

  listAdminMunicipalities: (stateCode?: string) => {
    const suffix = stateCode ? `?stateCode=${stateCode}` : ''
    return request<{ municipalities: AdminMunicipality[] }>(`/admin/municipalities${suffix}`)
  },
  createAdminMunicipality: (data: { name: string; stateCode: string; sortOrder?: number; active?: boolean }) =>
    request<{ municipality: AdminMunicipality }>('/admin/municipalities', jsonInit('POST', data)),
  updateAdminMunicipality: (id: string, data: Record<string, unknown>) =>
    request<{ municipality: AdminMunicipality }>(`/admin/municipalities/${id}`, jsonInit('PUT', data)),
  deleteAdminMunicipality: (id: string) =>
    request<{ ok: boolean }>(`/admin/municipalities/${id}`, { method: 'DELETE' }),

  listAdminSecretaries: (stateCode?: string) => {
    const suffix = stateCode ? `?stateCode=${stateCode}` : ''
    return request<{ secretaries: AdminSecretary[] }>(`/admin/secretaries${suffix}`)
  },
  createAdminSecretary: (data: { name: string; stateCode: string; emoji?: string; order?: number }) =>
    request<{ secretary: AdminSecretary }>('/admin/secretaries', jsonInit('POST', data)),
  updateAdminSecretary: (id: string, data: Record<string, unknown>) =>
    request<{ secretary: AdminSecretary }>(`/admin/secretaries/${id}`, jsonInit('PUT', data)),
  deleteAdminSecretary: (id: string) =>
    request<{ ok: boolean }>(`/admin/secretaries/${id}`, { method: 'DELETE' }),
}