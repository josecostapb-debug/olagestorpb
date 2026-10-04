import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import type { EvaluationListResponse, EvaluationStats } from '../types/api'
import { Alert, Badge, Button, Card, CardHeader, Select, Spinner } from '../components/ui'
import { Speedometer } from '../components/Speedometer'
import { feedbackTypeLabel, formatDateTime, ratingColor, whatsappLink } from '../lib/format'
import { cn } from '../lib/cn'

const TYPE_TONES: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  RECLAMACAO: 'danger',
  SUGESTAO: 'info',
  SOLICITACAO: 'warning',
  ELOGIO: 'success',
}

export function GabineteDashboardPage() {
  const { user, loading: loadingAuth, logout } = useAuth()
  const navigate = useNavigate()

  const [stats, setStats] = useState<EvaluationStats | null>(null)
  const [list, setList] = useState<EvaluationListResponse | null>(null)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loadingAuth) return
    if (!user) {
      navigate('/painel/login', { replace: true })
      return
    }
  }, [loadingAuth, user, navigate])

  useEffect(() => {
    if (!user) return
    setLoading(true)
    setError(null)
    const params = { feedbackType: filter || undefined, page }
    Promise.all([api.getEvaluationStats(), api.getEvaluations(params)])
      .then(([s, l]) => {
        setStats(s)
        setList(l)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [user, filter, page])

  const scopeLabel = 'Painel do Gabinete'

  if (loadingAuth) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }
  if (!user) return <Navigate to="/painel/login" replace />

  const averageText = stats ? stats.average.toFixed(1) : '—'

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Painel do Gabinete</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user.name} · {scopeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void logout().then(() => navigate('/painel/login'))}>
            Sair
          </Button>
          {user.role === 'SUPER_ADMIN' && (
            <Button variant="secondary" onClick={() => navigate('/admin')}>
              Administração
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {loading && !stats && (
        <div className="mt-10 flex justify-center">
          <Spinner className="h-8 w-8 text-primary-600" />
        </div>
      )}

      {stats && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Card className="p-5 lg:col-span-1">
            <Speedometer percentage={stats.percentage} value={averageText} sublabel={`${stats.total} avaliações`} />
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
            <Card className="p-5">
              <StatCard label="Total de avaliações" value={String(stats.total)} tone="text-primary-700" />
            </Card>
            <Card className="p-5">
              <StatCard label="Nota média" value={`${averageText}/10`} tone="text-slate-900" />
            </Card>
            <Card className="p-5">
              <StatCard label="Reclamações" value={String(stats.byType.RECLAMACAO)} tone="text-red-600" />
            </Card>
            <Card className="p-5">
              <StatCard label="Elogios" value={String(stats.byType.ELOGIO)} tone="text-emerald-600" />
            </Card>
          </div>
        </div>
      )}

      {stats && stats.bySecretary.length > 0 && (
        <Card className="mt-6">
          <CardHeader title="Desempenho por secretaria" />
          <div className="divide-y divide-slate-100">
            {stats.bySecretary.map((s) => (
              <div key={s.secretaryId} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                  <span>{s.emoji ?? '🏛️'}</span>
                  {s.name}
                </div>
                <div className="flex items-center gap-4">
                  <Badge tone="default">{s.count} aval.</Badge>
                  <span className={cn('font-bold', ratingColor(s.average))}>{s.average.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader
          title="Avaliações recebidas"
          action={
            <Select value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1) }} className="w-44">
              <option value="">Todos os tipos</option>
              <option value="RECLAMACAO">Reclamação</option>
              <option value="SUGESTAO">Sugestão</option>
              <option value="SOLICITACAO">Solicitação</option>
              <option value="ELOGIO">Elogio</option>
            </Select>
          }
        />
        <div>
          {list && list.evaluations.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhuma avaliação encontrada.</p>
          )}
          {list?.evaluations.map((ev) => (
            <EvaluationRow key={ev.id} ev={ev} />
          ))}
        </div>
        {list && list.pagination.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm">
            <span className="text-slate-500">
              Página {list.pagination.page} de {list.pagination.pages} · {list.pagination.total} no total
            </span>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" disabled={page >= list.pagination.pages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function StatCard({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div>
      <div className={cn('text-3xl font-black', tone)}>{value}</div>
      <div className="mt-1 text-sm text-slate-500">{label}</div>
    </div>
  )
}

function EvaluationRow({ ev }: { ev: EvaluationListResponse['evaluations'][number] }) {
  const target = ev.municipality?.name ?? 'Governo do Estado'
  const message = `Olá! Recebemos sua avaliação de ${target}: nota ${ev.rating}/10 (${feedbackTypeLabel(ev.feedbackType)}). "${ev.comment}"`
  const wa = whatsappLink(ev.citizenWhatsapp, message)
  return (
    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={TYPE_TONES[ev.feedbackType] ?? 'default'}>{feedbackTypeLabel(ev.feedbackType)}</Badge>
          <span className={cn('text-sm font-bold', ratingColor(ev.rating))}>{ev.rating}/10</span>
          <span className="text-sm text-slate-600">{target}</span>
          {ev.secretary && <Badge tone="info">{ev.secretary.emoji ?? ''} {ev.secretary.name}</Badge>}
        </div>
        <span className="text-xs text-slate-400">{formatDateTime(ev.createdAt)}</span>
      </div>
      <p className="text-sm text-slate-700">“{ev.comment}”</p>
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span>{ev.citizenName}</span>·<span>{ev.bairro}</span>·<span>{ev.locationType === 'RURAL' ? 'Zona rural' : 'Zona urbana'}</span>
      </div>
      <div className="mt-1">
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z" />
          </svg>
          Responder via WhatsApp
        </a>
      </div>
    </div>
  )
}