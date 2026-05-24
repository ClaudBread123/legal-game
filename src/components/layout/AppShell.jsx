import TopBar from './TopBar.jsx'

export default function AppShell({ children }) {
  return (
    <>
      <TopBar />
      <div style={{ paddingTop: '64px', minHeight: '100vh' }}>
        {children}
      </div>
    </>
  )
}
