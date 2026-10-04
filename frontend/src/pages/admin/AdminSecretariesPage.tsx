import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AdminSecretary, AdminState } from '../../types/api'
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select, Spinner } from '../../components/ui'

export function AdminSecretariesPage() {
  const [states, setStates] = useState<AdminState[]>([])
  const [stateCode, setStateCode] = useState('')
  const [secretaries, setSecretaries] = useState<AdminSecretary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .listAdminStates()
      .then((res) => {
        setStates(res.states)
        const first = res.states.find((s) => s.active)
        if (first) setStateCode(first.code)
      })
      .catch((e: Error) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!stateCode) return
    setLoading(true)
    setError(null)
    api
      .listAdminSecretaries(stateCode)
      .then((res) => setSecretaries(res.secretaries))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [stateCode])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.createAdminSecretary({ name: name.trim(), stateCode, emoji: emoji.trim() || undefined })
      setName('')
      setEmoji('')
      setShowForm(false)
      const res = await api.listAdminSecretaries(stateCode)
      setSecretaries(res.secretaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.')
    } finally {
      setSaving(false)
    }
  }

  async function move(id: string, delta: number) {
    setError(null)
    try {
      const res = await api.listAdminSecretaries(stateCode)
      const secretariesSorted = [...secretaries].sort((a, b) => a.order - b.order)
      const index = secretariesSorted.findIndex((s) => s.id === id)
      const target = secretariesSorted[index + delta]
      if (target) {
        await api.updateAdminSecretary(id, { order: target.order })
        await api.updateAdminSecretary(target.id, { order: secretariesSorted[index].order })
      }
      const fresh = await api.listAdminSecretaries(stateCode)
      setSecretaries(fresh.secretaries)
      void res
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reordenar.')
    }
  }

  async function toggle(s: AdminSecretary) {
    setError(null)
    try {
      await api.updateAdminSecretary(s.id, { active: !s.active })
      const res = await api.listAdminSecretaries(stateCode)
      setSecretaries(res.secretaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    }
  }

  async function remove(s: AdminSecretary) {
    if (!window.confirm(`Excluir a secretaria "${s.name}"?`)) return
    setError(null)
    try {
      await api.deleteAdminSecretary(s.id)
      const res = await api.listAdminSecretaries(stateCode)
      setSecretaries(res.secretaries)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  const sorted = [...secretaries].sort((a, b) => a.order - b.order)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Secretarias</h1>
          <p className="text-sm text-slate-500">Secretarias disponíveis na avaliação</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancelar' : '+ Nova secretaria'}</Button>
      </div>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <div className="mt-4">
        <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="w-44">
          <option value="">Estado...</option>
          {states.map((s) => (
            <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
          ))}
        </Select>
      </div>

      {showForm && (
        <Card className="mt-4 p-5">
          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-wrap items-end gap-3">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Saúde" className="w-64" required />
            </Field>
            <Field label="Emoji (opcional)">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🏥" className="w-24" />
            </Field>
            <Button type="submit" loading={saving}>Cadastrar</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : (
        <Card className="mt-4">
          <CardHeader title={`${sorted.length} secretarias`} />
          <div className="divide-y divide-slate-100">
            {sorted.map((s, index) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-lg">{s.emoji ?? '🏛️'}</span>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-400">{s._count.evaluations} avaliações</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => void move(s.id, -1)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={index === sorted.length - 1}
                      onClick={() => void move(s.id, 1)}
                      className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </div>
                  <Badge tone={s.active ? 'success' : 'danger'}>{s.active ? 'Ativa' : 'Inativa'}</Badge>
                  <button type="button" onClick={() => void toggle(s)} className="text-xs font-semibold text-primary-600 hover:underline">
                    {s.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" onClick={() => void remove(s)} className="text-xs font-semibold text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {sorted.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-400">Nenhuma secretaria cadastrada.</p>}
          </div>
        </Card>
      )}
    </div>
  )
}