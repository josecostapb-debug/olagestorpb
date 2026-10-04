import { Link, NavLink, Outlet } from 'react-router-dom'
import { cn } from '../lib/cn'

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M12 20s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10Z" strokeLinejoin="round" />
          <path d="m9.5 12 1.8 1.8L15 10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={cn('flex flex-col leading-tight', light ? 'text-white' : 'text-slate-900')}>
        <span className="text-base font-extrabold tracking-tight">OLAGESTOR<strong className="text-primary-500">360</strong></span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Ouvidoria Digital</span>
      </span>
    </span>
  )
}

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 transition-colors', isActive ? 'text-primary-700' : 'text-slate-600 hover:text-primary-700')
              }
            >
              Início
            </NavLink>
            <NavLink
              to="/avaliar"
              className={({ isActive }) =>
                cn('rounded-lg px-3 py-2 transition-colors', isActive ? 'text-primary-700' : 'text-slate-600 hover:text-primary-700')
              }
            >
              Avaliar
            </NavLink>
            <Link
              to="/painel/login"
              className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-600 transition-colors hover:border-primary-300 hover:text-primary-700"
            >
              Acesso do Gabinete
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-900 py-8 text-slate-300">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 text-center">
          <Logo light />
          <p className="max-w-xl text-sm text-slate-400">
            Canal de participação cidadã para avaliar a gestão dos municípios e estados.
            Sua opinião ajuda a construir uma administração pública melhor.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <Link to="/avaliar" className="text-slate-400 hover:text-white">Avaliar</Link>
            <Link to="/painel/login" className="text-slate-400 hover:text-white">Gabinete</Link>
          </div>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} OLAGESTOR360. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}