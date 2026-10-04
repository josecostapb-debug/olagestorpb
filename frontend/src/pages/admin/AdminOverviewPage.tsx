import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AdminState } from '../../types/api'
import { Alert, Badge, Button, Card, Field, Input, Spinner } from '../../components/ui'

export function AdminOverviewPage() {
  const [states, setStates] = useState<AdminState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    api
      .listAdminStates()
      .then((res) => setStates(res.states))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.createAdminState({ code, name })
      setShowForm(false)
      setCode('')
      setName('')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar estado.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleState(s: AdminState) {
    setError(null)
    try {
      await api.updateAdminState(s.id, { active: !s.active })
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Visão geral</h1>
          <p className="text-sm text-slate-500">Estados cadastrados no OLAGESTOR360</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancelar' : '+ Novo estado'}</Button>
      </div>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      {showForm && (
        <Card className="mt-4 p-5">
          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-wrap items-end gap-3">
            <Field label="UF">
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PB" maxLength={2} className="w-20" required />
            </Field>
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Paraíba" className="w-64" required />
            </Field>
            <Button type="submit" loading={saving}>Cadastrar</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {states.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-100 text-sm font-black text-primary-700">{s.code}</span>
                    <span className="font-bold text-slate-900">{s.name}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{s._count.municipalities} municípios</span>
                    <span>{s._count.secretaries} secretarias</span>
                    <span>{s._count.evaluations} avaliações</span>
                    <span>{s._count.users} usuários</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={s.active ? 'success' : 'danger'}>{s.active ? 'Ativo' : 'Inativo'}</Badge>
                  <button type="button" onClick={() => void toggleState(s)} className="text-xs font-semibold text-primary-600 hover:underline">
                    {s.active ? 'Desativar' : 'Ativar'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {states.length === 0 && (
            <Card className="p-6 text-sm text-slate-400">Nenhum estado cadastrado. Crie o primeiro estado para começar.</Card>
          )}
        </div>
      )}
    </div>
  )
}