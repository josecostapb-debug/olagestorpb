import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { AdminState, AdminUser } from '../../types/api'
import { Alert, Badge, Button, Card, CardHeader, Field, Input, Select, Spinner } from '../../components/ui'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [states, setStates] = useState<AdminState[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'SUPER_ADMIN' | 'GESTOR_MUNICIPIO'>('GESTOR_MUNICIPIO')
  const [stateCode, setStateCode] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([api.listUsers(), api.listAdminStates()])
      .then(([u, s]) => {
        setUsers(u.users)
        setStates(s.states)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function loadUsers() {
    const res = await api.listUsers()
    setUsers(res.users)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.createUser({ name, email, password, role, stateCode })
      setName('')
      setEmail('')
      setPassword('')
      setShowForm(false)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar usuário.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(u: AdminUser) {
    setError(null)
    try {
      await api.updateUser(u.id, { active: !u.active })
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar.')
    }
  }

  async function remove(u: AdminUser) {
    if (!window.confirm(`Excluir o usuário "${u.name}"?`)) return
    setError(null)
    try {
      await api.deleteUser(u.id)
      await loadUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">Acessos ao painel do gabinete e administração</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancelar' : '+ Novo usuário'}</Button>
      </div>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}

      {showForm && (
        <Card className="mt-4 p-5">
          <form onSubmit={(e) => void handleCreate(e)} className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>
            <Field label="E-mail">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Senha" hint="Mínimo 6 caracteres.">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
            <Field label="Perfil">
              <Select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                <option value="GESTOR_MUNICIPIO">Gestor de município</option>
                <option value="SUPER_ADMIN">Super administrador</option>
              </Select>
            </Field>
            {role === 'GESTOR_MUNICIPIO' && (
              <Field label="Estado">
                <Select value={stateCode} onChange={(e) => setStateCode(e.target.value)} required>
                  <option value="">Selecione...</option>
                  {states.map((s) => (
                    <option key={s.id} value={s.code}>{s.name} ({s.code})</option>
                  ))}
                </Select>
              </Field>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving}>Criar usuário</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="mt-10 flex justify-center"><Spinner className="h-8 w-8 text-primary-600" /></div>
      ) : (
        <Card className="mt-4">
          <CardHeader title={`${users.length} usuários`} />
          <div className="divide-y divide-slate-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    {u.name}
                    <Badge tone={u.role === 'SUPER_ADMIN' ? 'info' : 'default'}>
                      {u.role === 'SUPER_ADMIN' ? 'Super admin' : 'Gestor'}
                    </Badge>
                    {u.municipality && <Badge tone="success">{u.municipality.name}</Badge>}
                  </div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={u.active ? 'success' : 'danger'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                  <button type="button" onClick={() => void toggle(u)} className="text-xs font-semibold text-primary-600 hover:underline">
                    {u.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button type="button" onClick={() => void remove(u)} className="text-xs font-semibold text-red-600 hover:underline">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}