import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Booking from './pages/Booking'
import Cabinet from './pages/Cabinet'
import Admin from './pages/Admin'

function App() {
  const { pathname } = useLocation()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <AuthProvider>
      <div className={`app-container ${isAdmin ? 'admin-shell' : ''}`}>
        {!isAdmin && <Navbar />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        {!isAdmin && <Footer />}
      </div>
    </AuthProvider>
  )
}

export default App
