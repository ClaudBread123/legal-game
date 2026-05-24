import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useGameStore } from './store/gameStore.js'
import AppShell from './components/layout/AppShell.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CaseView from './pages/CaseView.jsx'
import Career from './pages/Career.jsx'
import EmailInbox from './pages/EmailInbox.jsx'
import Timekeeping from './pages/Timekeeping.jsx'
import './styles/globals.css'

function Root() {
  const { gameStarted } = useGameStore()

  if (!gameStarted) return <Onboarding />
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/case/:caseId" element={<CaseView />} />
        <Route path="/career" element={<Career />} />
        <Route path="/email" element={<EmailInbox />} />
        <Route path="/timekeeping" element={<Timekeeping />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/legal-game">
      <Root />
    </BrowserRouter>
  </React.StrictMode>
)
