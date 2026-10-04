import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import type { Municipality, Secretary, State, StateWithDetails } from '../types/api'
import { Alert, Button, Card, CardHeader, Field, Input, Select, Textarea, Spinner } from '../components/ui'
import { cn } from '../lib/cn'
import { feedbackTypeLabel } from '../lib/format'

const RATINGS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
const FEEDBACK_TYPES = ['RECLAMACAO', 'SUGESTAO', 'SOLICITACAO', 'ELOGIO'] as const

type Step = 'target' | 'identity' | 'details' | 'result'

interface MetaState {
  states: StateWithDetails[]
}

export function EvaluatePage() {
  const [params] = useSearchParams()
  const [meta, setMeta] = useState<MetaState | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)

  useEffect(() => {
    api
      .getMeta()
      .then((m) => setMeta(m))
      .catch(() => setMeta(null))
      .finally(() => setLoadingMeta(false))
  }, [])

  const initialStateCode = params.get('state')
  const initialMunicipality = params.get('municipality')
  const initialScope = params.get('scope') === 'ESTADO' ? 'ESTADO' : 'MUNICIPIO'

  const metadata = useMemo(() => meta ?? { states: [] }, [meta])

  const initialState = metadata.states.find((s) => s.code === initialStateCode?.toUpperCase()) ?? null
  const initialMunicipalityObj =
    initialState && initialMunicipality
      ? ({ id: initialMunicipality, name: '', slug: initialMunicipality } as Municipality)
      : null

  const hasTarget = Boolean(initialState && (initialScope === 'ESTADO' || initialMunicipalityObj))

  const [step, setStep] = useState<Step>(hasTarget ? 'identity' : 'target')

  const [state, setState] = useState<State | null>(initialState)
  const [municipalityList, setMunicipalityList] = useState<Municipality[]>([])
  const [municipality, setMunicipality] = useState<Municipality | null>(initialMunicipalityObj)
  const [municipalitySearch, setMunicipalitySearch] = useState('')
  const [secretaries, setSecretaries] = useState<Secretary[]>([])
  const [scope, setScope] = useState<'MUNICIPIO' | 'ESTADO'>(initialScope)

  const [secretary, setSecretary] = useState<string>('')
  const [form, setForm] = useState({
    citizenName: '',
    citizenCpf: '',
    citizenWhatsapp: '',
    bairro: '',
    locationType: 'URBANA' as 'URBANA' | 'RURAL',
    rating: 0,
    feedbackType: 'RECLAMACAO' as (typeof FEEDBACK_TYPES)[number],
    comment: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!state) return
    setMunicipality(null)
    api
      .getMunicipalities(state.code)
      .then((res) => setMunicipalityList(res.municipalities))
      .catch(() => setMunicipalityList([]))
    api
      .getSecretaries(state.code)
      .then((res) => setSecretaries(res.secretaries))
      .catch(() => setSecretaries([]))
  }, [state])

  const filteredMunicipalities = useMemo(() => {
    const q = municipalitySearch.trim().toLowerCase()
    if (!q) return municipalityList
    return municipalityList.filter((m) => m.name.toLowerCase().includes(q))
  }, [municipalityList, municipalitySearch])

  function chooseMunicipality(m: Municipality) {
    setMunicipality(m)
    setScope('MUNICIPIO')
    setStep('identity')
  }

  function chooseStateLevel() {
    setScope('ESTADO')
    setStep('identity')
  }

  async function handleSubmit() {
    if (!state) return
    if (!form.citizenName.trim() || form.citizenName.trim().length < 2) return setError('Informe seu nome completo.')
    if (!/^\d{10,11}$/.test(form.citizenWhatsapp.replace(/\D/g, ''))) {
      return setError('Informe um WhatsApp válido com DDD (ex.: 83999990000).')
    }
    if (!form.bairro.trim()) return setError('Informe seu bairro.')
    if (!form.rating) return setError('Dê uma nota de 1 a 10.')
    if (form.comment.trim().length < 5) return setError('Conte sua avaliação (mínimo 5 caracteres).')

    setSubmitting(true)
    setError(null)
    try {
      await api.createEvaluation({
        stateCode: state.code,
        scope,
        municipalitySlug: scope === 'MUNICIPIO' ? municipality?.slug : undefined,
        secretaryId: secretary || undefined,
        citizenName: form.citizenName,
        citizenCpf: form.citizenCpf || undefined,
        citizenWhatsapp: form.citizenWhatsapp,
        bairro: form.bairro,
        locationType: form.locationType,
        rating: form.rating,
        feedbackType: form.feedbackType,
        comment: form.comment,
      })
      setStep('result')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingMeta) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }

  if (step === 'result') {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-600">✓</div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Avaliação recebida!</h1>
        <p className="mt-2 text-slate-600">
          Sua nota de <strong>{form.rating}/10</strong> foi registrada. Obrigado por participar e ajudar a melhorar a gestão pública.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/" className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white">Voltar ao início</Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700"
          >
            Nova avaliação
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900">Avaliação de Gestão</h1>
        <p className="mt-1 text-sm text-slate-500">Suas respostas são anônimas e vão direto para a ouvidoria.</p>
      </div>

      {/* Passo 0: alvo */}
      {step === 'target' && (
        <Card>
          <CardHeader title="Selecione o alvo da avaliação" subtitle="Escolha o estado e o município" />
          <div className="space-y-4 p-5">
            <Field label="Estado">
              <Select
                value={state?.id ?? ''}
                onChange={(e) => {
                  const s = metadata.states.find((x) => x.id === e.target.value) ?? null
                  setState(s as State & StateWithDetails)
                }}
              >
                <option value="">Selecione...</option>
                {metadata.states.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </Select>
            </Field>

            {state && scope !== 'ESTADO' && (
              <Field label="Município">
                <Input placeholder="Buscar..." value={municipalitySearch} onChange={(e) => setMunicipalitySearch(e.target.value)} />
                <div className="mt-2 max-h-64 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {filteredMunicipalities.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => chooseMunicipality(m)}
                      className="flex w-full justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-primary-50"
                    >
                      <span>{m.name}</span>
                      <span className="text-primary-600">→</span>
                    </button>
                  ))}
                  {filteredMunicipalities.length === 0 && (
                    <p className="px-2 py-1 text-sm text-slate-400">Nenhum município encontrado.</p>
                  )}
                </div>
              </Field>
            )}

            {state && (
              <div className="flex flex-col gap-2 rounded-lg bg-primary-50 p-3 text-sm">
                <button type="button" onClick={chooseStateLevel} className="flex items-center justify-between font-semibold text-primary-800 hover:text-primary-700">
                  <span>Avaliar o Governo do Estado ({state.code})</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Passo 1: Identificação */}
      {step === 'identity' && state && (
        <Card>
          <CardHeader
            title={scope === 'ESTADO' ? `Governo do Estado (${state.name})` : municipality?.name ?? 'Município'}
            action={
              <button type="button" onClick={() => setStep('target')} className="text-xs font-semibold text-primary-600 hover:underline">
                Trocar
              </button>
            }
          />
          <div className="space-y-4 p-5">
            <Field label="Nome completo">
              <Input value={form.citizenName} onChange={(e) => setForm({ ...form, citizenName: e.target.value })} placeholder="Seu nome" />
            </Field>
            <Field label="CPF (opcional)" hint="Não é obrigatório. Se informado, é armazenado de forma segura (LGPD).">
              <Input value={form.citizenCpf} onChange={(e) => setForm({ ...form, citizenCpf: e.target.value })} placeholder="000.000.000-00" maxLength={14} />
            </Field>
            <Field label="WhatsApp" hint="Para o retorno da gestão (com DDD).">
              <Input value={form.citizenWhatsapp} onChange={(e) => setForm({ ...form, citizenWhatsapp: e.target.value })} placeholder="83999990000" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Bairro">
                <Input value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Seu bairro" />
              </Field>
              <Field label="Zona">
                <Select
                  value={form.locationType}
                  onChange={(e) => setForm({ ...form, locationType: e.target.value as 'URBANA' | 'RURAL' })}
                >
                  <option value="URBANA">Urbana</option>
                  <option value="RURAL">Rural</option>
                </Select>
              </Field>
            </div>
            <Button className="w-full" onClick={() => setStep('details')} disabled={!form.citizenName.trim() || !form.bairro.trim() || form.citizenWhatsapp.replace(/\D/g, '').length < 10}>
              Continuar
            </Button>
          </div>
        </Card>
      )}

      {/* Passo 2: Detalhes */}
      {step === 'details' && state && (
        <Card>
          <CardHeader
            title="Avalie a gestão"
            subtitle={scope === 'ESTADO' ? `${state.name} (${state.code})` : municipality?.name}
            action={
              <button type="button" onClick={() => setStep('identity')} className="text-xs font-semibold text-primary-600 hover:underline">
                Voltar
              </button>
            }
          />
          <div className="space-y-5 p-5">
            <Field label="Secretaria (opcional)" hint="Selecione quando a avaliação é sobre um serviço específico.">
              <Select value={secretary} onChange={(e) => setSecretary(e.target.value)}>
                <option value="">Não se aplica</option>
                {secretaries.map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name}</option>
                ))}
              </Select>
            </Field>

            <div>
              <div className="mb-1.5 block text-sm font-medium text-slate-700">Nota de 1 a 10</div>
              <div className="grid grid-cols-10 gap-1.5">
                {RATINGS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, rating: r })}
                    className={cn(
                      'rounded-lg border py-2 text-sm font-bold transition-colors',
                      form.rating === r
                        ? 'border-primary-600 bg-primary-600 text-white shadow'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-300 hover:text-primary-700',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Tipo de manifestação">
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, feedbackType: t })}
                    className={cn(
                      'rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors',
                      form.feedbackType === t
                        ? 'border-primary-600 bg-primary-50 text-primary-800'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200',
                    )}
                  >
                    {feedbackTypeLabel(t)}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Sua avaliação" hint="Conte o que motivou a nota (mín. 5 caracteres).">
              <Textarea value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="Descreva sua experiência..." />
            </Field>

            {error && <Alert tone="error">{error}</Alert>}

            <Button loading={submitting} onClick={() => void handleSubmit()} className="w-full">
              Enviar avaliação
            </Button>
          </div>
        </Card>
      )}

      <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-slate-400">
        {['target', 'identity', 'details'].indexOf(step) >= 0 && <StepDot active={step === 'target'} />}
        <StepDot active={step === 'identity'} />
        <StepDot active={step === 'details'} />
      </div>
    </div>
  )
}

function StepDot({ active }: { active: boolean }) {
  return <span className={cn('h-2 w-2 rounded-full', active ? 'bg-primary-600' : 'bg-slate-300')} />
}