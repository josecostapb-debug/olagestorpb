import { useEffect } from 'react'
import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Spinner } from '../../components/ui'
import { cn } from '../../lib/cn'

const NAV = [
  { to: '/admin', label: 'Visão geral', end: true },
  { to: '/admin/municipios', label: 'Municípios' },
  { to: '/admin/secretarias', label: 'Secretarias' },
  { to: '/admin/usuarios', label: 'Usuários' },
]

export function AdminLayout() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      navigate('/painel/login', { replace: true })
      return
    }
    if (user.role !== 'SUPER_ADMIN') {
      navigate('/painel', { replace: true })
    }
  }, [loading, user, navigate])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner className="h-8 w-8 text-primary-600" />
      </div>
    )
  }
  if (user.role !== 'SUPER_ADMIN') return <Navigate to="/painel" replace />

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-16 items-center border-b border-slate-100 px-5">
          <span className="text-sm font-extrabold text-slate-900">
            OLAGESTOR<strong className="text-primary-600">360</strong>
          </span>
          <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold uppercase text-primary-700">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary-50 text-primary-800' : 'text-slate-600 hover:bg-slate-100',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={() => void logout().then(() => navigate('/painel/login'))}
            className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5">
          <div className="flex items-center gap-2 text-sm text-slate-500 md:hidden">
            <span className="font-extrabold text-slate-900">OLAGESTOR360</span>
            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-700">Admin</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-slate-500 md:block">{user.name}</span>
            <button
              type="button"
              onClick={() => void logout().then(() => navigate('/painel/login'))}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 md:hidden"
            >
              Sair
            </button>
          </div>
        </header>
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}