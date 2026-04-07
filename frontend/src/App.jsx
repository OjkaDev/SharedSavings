import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'
import Household from './pages/Household'
import HouseholdDetail from './pages/HouseholdDetail'
import PersonalFinances from './pages/PersonalFinances'
import Settings from './pages/Settings'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="personal" element={<PersonalFinances />} />
        <Route path="household" element={<Household />} />
        <Route path="household/:id" element={<HouseholdDetail />} />
        <Route path="settings" element={<Settings />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
