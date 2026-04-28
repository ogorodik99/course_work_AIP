import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
    setMobileMenuOpen(false)
  }

  const handleNavClick = (path) => {
    navigate(path)
    setMobileMenuOpen(false)
  }

  const handleAnchorClick = (id) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo" onClick={() => handleNavClick('/')}>
          <svg className="navbar-logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" fill="currentColor" />
          </svg>
          <span>МедЗапись</span>
        </div>

        {/* Desktop Menu */}
        <div className="navbar-menu">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('/')
            }}
            className="navbar-link"
          >
            Главная
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleAnchorClick('benefits')
            }}
            className="navbar-link"
          >
            Преимущества
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleAnchorClick('specialists')
            }}
            className="navbar-link"
          >
            Специалисты
          </a>
        </div>

        {/* Auth Section */}
        <div className="navbar-auth">
          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  className="navbar-link"
                  onClick={() => handleNavClick('/admin')}
                >
                  Админ-панель
                </button>
              )}
              {user.role === 'patient' && (
                <button
                  className="navbar-link"
                  onClick={() => handleNavClick('/cabinet')}
                >
                  Кабинет
                </button>
              )}
              <button className="navbar-logout-btn" onClick={handleLogout}>
                Выход
              </button>
            </>
          ) : (
            <>
              <button
                className="navbar-link"
                onClick={() => handleNavClick('/auth')}
              >
                Войти
              </button>
              <button
                className="navbar-booking-btn"
                onClick={() => handleNavClick('/booking')}
              >
                Записаться
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="navbar-mobile-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-menu">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('/')
            }}
            className="navbar-mobile-link"
          >
            Главная
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleAnchorClick('benefits')
            }}
            className="navbar-mobile-link"
          >
            Преимущества
          </a>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handleAnchorClick('specialists')
            }}
            className="navbar-mobile-link"
          >
            Специалисты
          </a>
          <div className="navbar-mobile-divider"></div>
          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  className="navbar-mobile-link"
                  onClick={() => handleNavClick('/admin')}
                >
                  Админ-панель
                </button>
              )}
              {user.role === 'patient' && (
                <button
                  className="navbar-mobile-link"
                  onClick={() => handleNavClick('/cabinet')}
                >
                  Кабинет
                </button>
              )}
              <button className="navbar-mobile-link navbar-logout-text" onClick={handleLogout}>
                Выход
              </button>
            </>
          ) : (
            <>
              <button
                className="navbar-mobile-link"
                onClick={() => handleNavClick('/auth')}
              >
                Войти
              </button>
              <button
                className="navbar-mobile-booking"
                onClick={() => handleNavClick('/booking')}
              >
                Записаться
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  )
}

export default Navbar
