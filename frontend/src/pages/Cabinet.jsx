import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyAppointments, cancelAppointment, getMedicalCard, updateProfile } from '../api/index';
import '../styles/Cabinet.css';

const Cabinet = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Tabs and UI state
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data state
  const [appointments, setAppointments] = useState([]);
  const [medicalCard, setMedicalCard] = useState(null);
  const [profile, setProfile] = useState({});

  // Profile editing state
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Redirect if not authenticated or if admin
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  }, [user, navigate]);

  // Load data when tab changes
  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const loadTabData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'upcoming' || activeTab === 'history') {
        const data = await getMyAppointments();
        setAppointments(data);
      } else if (activeTab === 'medcard') {
        const data = await getMedicalCard();
        setMedicalCard(data);
      } else if (activeTab === 'profile') {
        const data = await getMyAppointments(); // Load profile data
        setProfile({
          name: user?.name || '',
          email: user?.email || '',
          phone: data.phone || '',
          bloodType: data.bloodType || '',
          allergies: data.allergies || '',
          chronicDiseases: data.chronicDiseases || '',
        });
        setEditedProfile({
          name: user?.name || '',
          email: user?.email || '',
          phone: data.phone || '',
          bloodType: data.bloodType || '',
          allergies: data.allergies || '',
          chronicDiseases: data.chronicDiseases || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (err) {
      setError('Ошибка при выходе');
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      await cancelAppointment(appointmentId);
      setConfirmCancel(null);
      loadTabData();
    } catch (err) {
      setError('Ошибка при отмене записи');
    }
  };

  const handleEditProfile = () => {
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateProfile({
        phone: editedProfile.phone,
        bloodType: editedProfile.bloodType,
        allergies: editedProfile.allergies,
        chronicDiseases: editedProfile.chronicDiseases,
      });
      setProfile(editedProfile);
      setEditing(false);
    } catch (err) {
      setError('Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile(profile);
    setEditing(false);
  };

  const handleProfileChange = (field, value) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Filter appointments by status
  const upcomingAppointments = appointments.filter(
    apt => apt.status === 'scheduled' && new Date(apt.date) >= new Date()
  );

  const historyAppointments = appointments.filter(
    apt => apt.status === 'completed' || apt.status === 'cancelled'
  );

  // Format date and time
  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString('ru-RU'),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  if (!user) return null;

  return (
    <div className="cabinet-container">
      {/* Header */}
      <header className="cabinet-header">
        <div className="cabinet-header-content">
          <div className="header-greeting">
            <h1>Личный кабинет</h1>
            <p>Здравствуйте, {user.name}</p>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Выход
          </button>
        </div>
      </header>

      {/* Error Message */}
      {error && <div className="cabinet-error">{error}</div>}

      {/* Tabs */}
      <div className="cabinet-tabs">
        <button
          className={`cabinet-tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <i className="bi bi-calendar-check"></i>
          <span>Предстоящие</span>
        </button>
        <button
          className={`cabinet-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <i className="bi bi-clock-history"></i>
          <span>История</span>
        </button>
        <button
          className={`cabinet-tab ${activeTab === 'medcard' ? 'active' : ''}`}
          onClick={() => setActiveTab('medcard')}
        >
          <i className="bi bi-file-medical"></i>
          <span>Медкарта</span>
        </button>
        <button
          className={`cabinet-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          <i className="bi bi-person-gear"></i>
          <span>Профиль</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="cabinet-content">
        {loading && <div className="loading-spinner">Загрузка...</div>}

        {/* Предстоящие */}
        {activeTab === 'upcoming' && !loading && (
          <div className="tab-section">
            <h2>Предстоящие записи</h2>
            {upcomingAppointments.length > 0 ? (
              <div className="appointments-list">
                {upcomingAppointments.map(apt => {
                  const { date, time } = formatDateTime(apt.date);
                  return (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-header">
                        <div className="appointment-doctor">
                          <h3>{apt.doctorName}</h3>
                          <p className="specialty">{apt.specialization}</p>
                        </div>
                        <span className="status-badge scheduled">
                          {apt.status === 'scheduled' ? 'Запланирована' : apt.status}
                        </span>
                      </div>
                      <div className="appointment-details">
                        <div className="detail-item">
                          <i className="bi bi-calendar"></i>
                          <span>{date}</span>
                        </div>
                        <div className="detail-item">
                          <i className="bi bi-clock"></i>
                          <span>{time}</span>
                        </div>
                      </div>
                      <div className="appointment-actions">
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => setConfirmCancel(apt.id)}
                        >
                          Отменить
                        </button>
                      </div>
                      {confirmCancel === apt.id && (
                        <div className="confirm-dialog">
                          <p>Вы уверены, что хотите отменить эту запись?</p>
                          <div className="confirm-actions">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleCancelAppointment(apt.id)}
                            >
                              Да, отменить
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setConfirmCancel(null)}
                            >
                              Нет, отменить
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-inbox"></i>
                <h3>Нет предстоящих записей</h3>
                <p>У вас нет запланированных приемов</p>
                <Link to="/booking" className="btn btn-primary">
                  Записаться к врачу
                </Link>
              </div>
            )}
          </div>
        )}

        {/* История */}
        {activeTab === 'history' && !loading && (
          <div className="tab-section">
            <h2>История посещений</h2>
            {historyAppointments.length > 0 ? (
              <div className="appointments-list">
                {historyAppointments.map(apt => {
                  const { date, time } = formatDateTime(apt.date);
                  const statusColor = apt.status === 'completed' ? 'completed' : 'cancelled';
                  const statusText = apt.status === 'completed' ? 'Завершена' : 'Отменена';
                  return (
                    <div key={apt.id} className="appointment-card">
                      <div className="appointment-header">
                        <div className="appointment-doctor">
                          <h3>{apt.doctorName}</h3>
                          <p className="specialty">{apt.specialization}</p>
                        </div>
                        <span className={`status-badge ${statusColor}`}>
                          {statusText}
                        </span>
                      </div>
                      <div className="appointment-details">
                        <div className="detail-item">
                          <i className="bi bi-calendar"></i>
                          <span>{date}</span>
                        </div>
                        <div className="detail-item">
                          <i className="bi bi-clock"></i>
                          <span>{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-archive"></i>
                <h3>История посещений пуста</h3>
                <p>У вас еще нет завершенных или отменных приемов</p>
              </div>
            )}
          </div>
        )}

        {/* Медкарта */}
        {activeTab === 'medcard' && !loading && (
          <div className="tab-section">
            <h2>Медицинская карта</h2>
            {medicalCard ? (
              <div className="medcard-content">
                <div className="medcard-section">
                  <h3>Основная информация</h3>
                  <div className="medcard-info">
                    <div className="info-item">
                      <label>Группа крови:</label>
                      <p>{medicalCard.bloodType || 'Не указана'}</p>
                    </div>
                    <div className="info-item">
                      <label>Аллергии:</label>
                      <p>{medicalCard.allergies || 'Не указаны'}</p>
                    </div>
                    <div className="info-item">
                      <label>Хронические заболевания:</label>
                      <p>{medicalCard.chronicDiseases || 'Не указаны'}</p>
                    </div>
                  </div>
                </div>

                {medicalCard.records && medicalCard.records.length > 0 && (
                  <div className="medcard-section">
                    <h3>Записи врача</h3>
                    <div className="records-list">
                      {medicalCard.records.map((record, idx) => (
                        <div key={idx} className="record-card">
                          <div className="record-header">
                            <span className="record-date">
                              {new Date(record.date).toLocaleDateString('ru-RU')}
                            </span>
                            <span className="record-doctor">{record.doctorName}</span>
                          </div>
                          <div className="record-details">
                            <p className="diagnosis">
                              <strong>Диагноз:</strong> {record.diagnosis}
                            </p>
                            {record.prescriptions && (
                              <p className="prescriptions">
                                <strong>Назначения:</strong> {record.prescriptions}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-state">
                <i className="bi bi-file-earmark"></i>
                <h3>Медкарта не заполнена</h3>
                <p>Медицинские данные еще не добавлены</p>
              </div>
            )}
          </div>
        )}

        {/* Профиль */}
        {activeTab === 'profile' && !loading && (
          <div className="tab-section">
            <div className="profile-header">
              <h2>Мой профиль</h2>
              {!editing && (
                <button onClick={handleEditProfile} className="btn btn-primary btn-sm">
                  <i className="bi bi-pencil"></i> Редактировать
                </button>
              )}
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label>ФИО</label>
                {editing ? (
                  <input
                    type="text"
                    value={editedProfile.name}
                    onChange={e => handleProfileChange('name', e.target.value)}
                    disabled
                  />
                ) : (
                  <p className="form-display">{profile.name}</p>
                )}
              </div>

              <div className="form-group">
                <label>Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={e => handleProfileChange('email', e.target.value)}
                    disabled
                  />
                ) : (
                  <p className="form-display">{profile.email}</p>
                )}
              </div>

              <div className="form-group">
                <label>Телефон</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={e => handleProfileChange('phone', e.target.value)}
                    placeholder="+7 (999) 999-99-99"
                  />
                ) : (
                  <p className="form-display">{profile.phone || 'Не указан'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Группа крови</label>
                {editing ? (
                  <select
                    value={editedProfile.bloodType}
                    onChange={e => handleProfileChange('bloodType', e.target.value)}
                  >
                    <option value="">Выберите группу крови</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                ) : (
                  <p className="form-display">{profile.bloodType || 'Не указана'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Аллергии</label>
                {editing ? (
                  <textarea
                    value={editedProfile.allergies}
                    onChange={e => handleProfileChange('allergies', e.target.value)}
                    placeholder="Укажите известные аллергии"
                    rows="3"
                  />
                ) : (
                  <p className="form-display">{profile.allergies || 'Не указаны'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Хронические заболевания</label>
                {editing ? (
                  <textarea
                    value={editedProfile.chronicDiseases}
                    onChange={e => handleProfileChange('chronicDiseases', e.target.value)}
                    placeholder="Укажите хронические заболевания"
                    rows="3"
                  />
                ) : (
                  <p className="form-display">{profile.chronicDiseases || 'Не указаны'}</p>
                )}
              </div>

              {editing && (
                <div className="profile-actions">
                  <button onClick={handleSaveProfile} className="btn btn-success">
                    Сохранить
                  </button>
                  <button onClick={handleCancelEdit} className="btn btn-secondary">
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cabinet;
