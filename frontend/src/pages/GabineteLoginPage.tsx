import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Alert, Button, Card, CardHeader, Field, Input, Spinner } from '../components/ui'

export function GabineteLoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login(email, password)
      navigate('/painel')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha no login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader title="Acesso do Gabinete" subtitle="Entre com suas credenciais de gestor" />
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
          <Field label="E-mail">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="gestor@municipio.gov.br"
              autoComplete="email"
              required
            />
          </Field>
          <Field label="Senha">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </Field>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full">
            Entrar
          </Button>
        </form>
      </Card>
      {loading && (
        <div className="mt-4 flex justify-center">
          <Spinner className="h-5 w-5 text-primary-600" />
        </div>
      )}
    </div>
  )
}