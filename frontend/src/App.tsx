import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from './components/Layout'
import { HomePage } from './pages/HomePage'
import { EvaluatePage } from './pages/EvaluatePage'
import { GabineteLoginPage } from './pages/GabineteLoginPage'
import { GabineteDashboardPage } from './pages/GabineteDashboardPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage'
import { AdminMunicipalitiesPage } from './pages/admin/AdminMunicipalitiesPage'
import { AdminSecretariesPage } from './pages/admin/AdminSecretariesPage'
import { AdminUsersPage } from './pages/admin/AdminUsersPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/avaliar" element={<EvaluatePage />} />
        <Route path="/painel/login" element={<GabineteLoginPage />} />
      </Route>

      <Route path="/painel" element={<GabineteDashboardPage />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverviewPage />} />
        <Route path="municipios" element={<AdminMunicipalitiesPage />} />
        <Route path="secretarias" element={<AdminSecretariesPage />} />
        <Route path="usuarios" element={<AdminUsersPage />} />
      </Route>
    </Routes>
  )
}