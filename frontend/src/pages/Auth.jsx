import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
// styles loaded from global.css in main.jsx

const Auth = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(loginEmail, loginPassword);

      if (response.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/cabinet');
      }
    } catch (err) {
      setError(err.message || 'Ошибка при входе. Проверьте учетные данные.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!regName.trim()) {
        throw new Error('Пожалуйста, введите ваше имя');
      }
      if (!regEmail.trim()) {
        throw new Error('Пожалуйста, введите электронную почту');
      }
      if (regPassword.length < 6) {
        throw new Error('Пароль должен быть не менее 6 символов');
      }

      await register(regName, regEmail, regPassword);
      navigate('/cabinet');
    } catch (err) {
      setError(err.message || 'Ошибка при регистрации. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo Header */}
        <div className="auth-header">
          <h1>МедЗапись</h1>
        </div>

        {/* Tab Switcher */}
        <div className="tab-switcher">
          <button
            className={`tab-button ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('login');
              setError('');
            }}
          >
            Вход
          </button>
          <button
            className={`tab-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('register');
              setError('');
            }}
          >
            Регистрация
          </button>
          <div className="tab-indicator"></div>
        </div>

        {/* Error Message */}
        {error && <div className="auth-error">{error}</div>}

        {/* Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="login-email">Электронная почта</label>
              <input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Пароль</label>
              <input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-name">Полное имя</label>
              <input
                id="reg-name"
                type="text"
                placeholder="Иван Иванов"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Электронная почта</label>
              <input
                id="reg-email"
                type="email"
                placeholder="your@email.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Пароль</label>
              <input
                id="reg-password"
                type="password"
                placeholder="••••••••"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}

        {/* Home Link */}
        <div className="auth-footer">
          <Link to="/" className="auth-link">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
