import { useEffect, useMemo, useState } from 'react'
import { api } from '../../lib/api'
import type { AdminMunicipality, AdminState } from '../../types/api'
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select, Spinner } from '../../components/ui'

export function AdminMunicipalitiesPage() {
  const [states, setStates] = useState<AdminState[]>([])
  const [stateCode, setStateCode] = useState('')
  const [municipalities, setMunicipalities] = useState<AdminMunicipality[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
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
      .listAdminMunicipalities(stateCode)
      .then((res) => setMunicipalities(res.municipalities))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [stateCode])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return municipalities
    return municipalities.filter((m) => m.name.toLowerCase().includes(q))
  }, [municipalities, search])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      await api.createAdminMunicipality({ name: name.trim(), stateCode })
      setName('')
      setShowForm(false)
      const res = await api.listAdminMunicipalities(stateCode)
      setMunicipalities(res.municipalities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(m: AdminMunicipality) {
    setError(null)
    try {
      await api.updateAdminMunicipality(m.id, { active: !m.active })
      const res = await api.listAdminMunicipalities(stateCode)
      setMunicipalities(res.municipalities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    }
  }

  async function remove(m: AdminMunicipality) {
    if (!window.confirm(`Excluir o município "${m.name}"? Esta ação não pode ser desfeita.`)) return
    setError(null)
    try {
      await api.deleteAdminMunicipality(m.id)
      const res = await api.listAdminMunicipalities(stateCode)
      setMunicipalities(res.municipalities)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Municípios</h1>
          <p className="text-sm text-slate-500">Gerencie os municípios de cada estado</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancelar' : '+ Novo município'}</Button>
      </div>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      <div className="mt-4 flex flex-wrap gap-3">
        <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} className="w-44">
          <option value="">Estado...</option>
          {states.map((s) => (
            <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
          ))}
        </Select>
        <Input placeholder="Buscar município..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>

      {showForm && (
        <Card className="mt-4 p-5">
          <form onSubmit={(e) => void handleCreate(e)} className="flex flex-wrap items-end gap-3">
            <Field label="Nome do município">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: João Pessoa" className="w-80" required />
            </Field>
            <Button type="submit" loading={saving}>Cadastrar</Button>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : (
        <Card className="mt-4">
          <CardHeader title={`${filtered.length} municípios`} />
          <div className="divide-y divide-slate-100">
            {filtered.slice(0, 200).map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-400">{m._count.evaluations} avaliações</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={m.active ? 'success' : 'danger'}>{m.active ? 'Ativo' : 'Inativo'}</Badge>
                  <button type="button" onClick={() => void toggle(m)} className="text-xs font-semibold text-primary-600 hover:underline">
                    {m.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" onClick={() => void remove(m)} className="text-xs font-semibold text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="px-5 py-6 text-center text-sm text-slate-400">Nenhum município encontrado.</p>}
            {filtered.length > 200 && (
              <p className="px-5 py-3 text-center text-xs text-slate-400">
                Mostrando os primeiros 200 resultados. Use a busca para encontrar o município.
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}