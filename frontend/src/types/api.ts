export type UserRole = 'SUPER_ADMIN' | 'GESTOR_MUNICIPIO'
export type FeedbackType = 'RECLAMACAO' | 'SUGESTAO' | 'SOLICITACAO' | 'ELOGIO'
export type LocationType = 'URBANA' | 'RURAL'
export type EvaluationScope = 'MUNICIPIO' | 'ESTADO'

export interface State {
  id: string
  code: string
  name: string
  slug: string
}

export interface Municipality {
  id: string
  name: string
  slug: string
}

export interface Secretary {
  id: string
  name: string
  emoji: string | null
}

export interface StateWithDetails extends State {
  secretaries: Secretary[]
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  stateId: string | null
  municipalityId: string | null
  municipality: { name: string; slug: string } | null
  state: { code: string; name: string } | null
}

export interface Evaluation {
  id: string
  scope: EvaluationScope
  rating: number
  feedbackType: FeedbackType
  comment: string
  bairro: string
  locationType: LocationType
  citizenName: string
  citizenWhatsapp: string
  createdAt: string
  municipality: { name: string } | null
  secretary: { name: string; emoji: string | null } | null
}

export interface EvaluationListResponse {
  evaluations: Evaluation[]
  pagination: { page: number; pageSize: number; total: number; pages: number }
}

export interface EvaluationStats {
  total: number
  average: number
  percentage: number
  firstEvaluationAt: string | null
  byType: Record<FeedbackType, number>
  byLocation: Record<LocationType, number>
  bySecretary: {
    secretaryId: string
    name: string
    emoji: string | null
    count: number
    average: number
  }[]
}

export interface CreateEvaluationInput {
  stateCode: string
  scope: EvaluationScope
  municipalitySlug?: string
  secretaryId?: string
  citizenName: string
  citizenCpf?: string
  citizenWhatsapp: string
  bairro: string
  locationType: LocationType
  rating: number
  feedbackType: FeedbackType
  comment: string
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
  state: { code: string; name: string } | null
  municipality: { name: string; slug: string } | null
  createdAt: string
}

export interface AdminState {
  id: string
  code: string
  name: string
  slug: string
  active: boolean
  _count: { municipalities: number; secretaries: number; evaluations: number; users: number }
}

export interface AdminMunicipality {
  id: string
  name: string
  slug: string
  active: boolean
  sortOrder: number
  state: { code: string; name: string }
  _count: { evaluations: number }
}

export interface AdminSecretary {
  id: string
  name: string
  emoji: string | null
  order: number
  active: boolean
  state: { code: string }
  _count: { evaluations: number }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  pages: number
}