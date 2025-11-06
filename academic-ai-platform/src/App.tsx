import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LocaleProvider } from './contexts/LocaleContext'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import PDFUploadPage from './pages/PDFUploadPage'
import ChatPage from './pages/ChatPage'
import WritingPage from './pages/WritingPage'
import SourcesPage from './pages/SourcesPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading...</div>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><PDFUploadPage /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
      <Route path="/write" element={<ProtectedRoute><WritingPage /></ProtectedRoute>} />
      <Route path="/sources" element={<ProtectedRoute><SourcesPage /></ProtectedRoute>} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <LocaleProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  )
}

export default App
