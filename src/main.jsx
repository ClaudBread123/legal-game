import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useGameStore } from './store/gameStore.js'
import AppShell from './components/layout/AppShell.jsx'
import Onboarding from './pages/Onboarding.jsx'
import Dashboard from './pages/Dashboard.jsx'
import CaseView from './pages/CaseView.jsx'
import Career from './pages/Career.jsx'
import EmailInbox from './pages/EmailInbox.jsx'
import Timekeeping from './pages/Timekeeping.jsx'
import './styles/globals.css'

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/case/:caseId" element={<CaseView />} />
        <Route path="/career" element={<Career />} />
        <Route path="/email" element={<EmailInbox />} />
        <Route path="/timekeeping" element={<Timekeeping />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

function Root() {
  const { gameStarted } = useGameStore()
  const [sessionReady, setSessionReady] = useState(false)

  if (!gameStarted || !sessionReady) {
    return <Onboarding onReady={() => setSessionReady(true)} />
  }

  return (
    <AppShell>
      <AnimatedRoutes />
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
