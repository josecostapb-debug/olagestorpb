import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import type { Municipality, State, StateWithDetails } from '../types/api'
import { Alert, Badge, Input, Spinner } from '../components/ui'

export function HomePage() {
  const [states, setStates] = useState<StateWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getMeta()
      .then(({ states: list }) => setStates(list))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <Badge tone="info" className="!bg-white/15 !text-primary-100">
            Canal oficial de participação cidadã
          </Badge>
          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">
            Avalie a gestão do seu município
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-white/85">
            O OLAGESTOR360 é a ouvidoria digital que leva a sua opinião até a gestão pública.
            Poucos minutos e você contribui com uma administração mais transparente.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/avaliar"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary-700 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              Começar avaliação
            </Link>
            <Link
              to="/painel/login"
              className="rounded-xl border border-white/40 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              Acesso do Gabinete
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-extrabold text-slate-900">Escolha o município</h2>
        <p className="mt-1 text-sm text-slate-500">Selecione o estado e encontre o seu município para avaliar a gestão.</p>

        {loading && (
          <div className="mt-10 flex justify-center">
            <Spinner className="h-8 w-8 text-primary-600" />
          </div>
        )}
        {error && <div className="mt-6"><Alert tone="error">{error}</Alert></div>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {states.map((state) => (
            <StateCard key={state.id} state={state} />
          ))}
        </div>
      </section>
    </div>
  )
}

function StateCard({ state }: { state: State }) {
  const [open, setOpen] = useState(false)
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || municipalities.length > 0 || loading) return
    setLoading(true)
    api
      .getMunicipalities(state.code)
      .then((res) => setMunicipalities(res.municipalities))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [open, state.code, municipalities.length, loading])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return municipalities
    return municipalities.filter((m) => m.name.toLowerCase().includes(q))
  }, [municipalities, search])

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary-100 text-sm font-black text-primary-700">
            {state.code}
          </span>
          <div>
            <div className="font-bold text-slate-900">{state.name}</div>
            <div className="text-xs text-slate-500">Escolher município</div>
          </div>
        </div>
        <svg
          className={`h-5 w-5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <Input
            placeholder="Buscar município..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {error && <div className="mt-3"><Alert tone="error">{error}</Alert></div>}
          {loading ? (
            <div className="mt-4 flex justify-center py-4">
              <Spinner className="h-6 w-6 text-primary-500" />
            </div>
          ) : (
            <div className="mt-3 max-h-64 space-y-1 overflow-y-auto pr-1">
              {filtered.map((m) => (
                <Link
                  key={m.id}
                  to={`/avaliar?state=${state.code}&municipality=${m.slug}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-primary-50 hover:text-primary-800"
                >
                  <span>{m.name}</span>
                  <span className="text-xs font-semibold text-primary-600">Avaliar →</span>
                </Link>
              ))}
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-sm text-slate-400">Nenhum município encontrado.</p>
              )}
            </div>
          )}
          <Link
            to={`/avaliar?state=${state.code}&scope=ESTADO`}
            className="mt-3 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-100"
          >
            <span>Avaliar o Governo do Estado ({state.code})</span>
            <span className="text-xs">→</span>
          </Link>
        </div>
      )}
    </div>
  )
}