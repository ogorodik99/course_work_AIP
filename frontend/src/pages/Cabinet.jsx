import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  cancelAppointment,
  getMedicalCard,
  getMyAppointments,
  statusLabel,
  updateProfile,
} from '../api/index';

const tabs = [
  { id: 'upcoming', label: 'Предстоящие' },
  { id: 'history', label: 'История' },
  { id: 'medcard', label: 'Медкарта' },
  { id: 'profile', label: 'Профиль' },
];

const emptyProfile = {
  name: '',
  email: '',
  phone: '',
  birthDate: '',
  bloodType: '',
  allergies: '',
  chronicDiseases: '',
  insuranceNumber: '',
};

function todayStart() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function appointmentDate(appointment) {
  return new Date(`${appointment.date}T${appointment.time || '00:00'}`);
}

function formatAppointment(appointment) {
  const date = appointmentDate(appointment);
  return {
    date: Number.isNaN(date.getTime()) ? appointment.date : date.toLocaleDateString('ru-RU'),
    time: appointment.time || '',
  };
}

function profileFromCard(card, user) {
  return {
    name: card?.fullName || user?.name || '',
    email: card?.email || user?.email || '',
    phone: card?.phone || '',
    birthDate: card?.birthDate || '',
    bloodType: card?.bloodType || '',
    allergies: card?.allergies || '',
    chronicDiseases: card?.chronicDiseases || '',
    insuranceNumber: card?.insuranceNumber || '',
  };
}

const Cabinet = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [medicalCard, setMedicalCard] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [editedProfile, setEditedProfile] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
    } else if (user.role === 'admin') {
      navigate('/admin');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user?.role === 'patient') {
      loadTabData();
    }
  }, [activeTab, authLoading, user?.id]);

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const activeStatus = ['pending', 'confirmed', 'scheduled'].includes(appointment.status);
        return activeStatus && appointmentDate(appointment) >= todayStart();
      }),
    [appointments]
  );

  const historyAppointments = useMemo(
    () =>
      appointments.filter((appointment) => {
        const finalStatus = ['completed', 'cancelled'].includes(appointment.status);
        return finalStatus || appointmentDate(appointment) < todayStart();
      }),
    [appointments]
  );

  async function loadTabData() {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'upcoming' || activeTab === 'history') {
        setAppointments(await getMyAppointments());
      }

      if (activeTab === 'medcard' || activeTab === 'profile') {
        const card = await getMedicalCard();
        const nextProfile = profileFromCard(card, user);
        setMedicalCard(card);
        setProfile(nextProfile);
        setEditedProfile(nextProfile);
      }
    } catch (err) {
      setError(err.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/auth');
  }

  async function handleCancelAppointment(appointmentId) {
    try {
      setLoading(true);
      await cancelAppointment(appointmentId);
      setConfirmCancel(null);
      setAppointments(await getMyAppointments());
    } catch (err) {
      setError(err.message || 'Ошибка при отмене записи');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    try {
      setLoading(true);
      await updateProfile({
        fullName: editedProfile.name,
        phone: editedProfile.phone,
        birthDate: editedProfile.birthDate,
        bloodType: editedProfile.bloodType,
        allergies: editedProfile.allergies,
        chronicDiseases: editedProfile.chronicDiseases,
        insuranceNumber: editedProfile.insuranceNumber,
      });

      const card = await getMedicalCard();
      const nextProfile = profileFromCard(card, user);
      setMedicalCard(card);
      setProfile(nextProfile);
      setEditedProfile(nextProfile);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Ошибка при сохранении профиля');
    } finally {
      setLoading(false);
    }
  }

  function handleProfileChange(field, value) {
    setEditedProfile((prev) => ({ ...prev, [field]: value }));
  }

  function renderAppointmentCard(appointment, canCancel = false) {
    const { date, time } = formatAppointment(appointment);
    const remindDate = appointment.reminderAt
      ? new Date(appointment.reminderAt.replace(' ', 'T'))
      : new Date(appointmentDate(appointment));
    if (!appointment.reminderAt) {
      remindDate.setDate(remindDate.getDate() - 1);
    }

    return (
      <article key={appointment.id} className={`appointment-card ${appointment.status}`}>
        <div className="appointment-main">
          <div>
            <h3>{appointment.doctorName || 'Врач не указан'}</h3>
            <p>{appointment.specialization || 'Специальность не указана'}</p>
          </div>
          <span className={`status-badge status-${appointment.status}`}>
            {appointment.statusLabel || statusLabel(appointment.status)}
          </span>
        </div>

        <div className="appointment-details">
          <span>{date}</span>
          <span>{time}</span>
          {appointment.cabinet && <span>Кабинет {appointment.cabinet}</span>}
        </div>

        {canCancel && (
          <p className="reminder-note">
            Напоминание: {remindDate.toLocaleDateString('ru-RU')}
            {appointment.reminderMethods ? `, ${appointment.reminderMethods.toUpperCase()}` : ''}
          </p>
        )}

        {canCancel && (
          <div className="appointment-actions">
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmCancel(appointment.id)}>
              Отменить запись
            </button>
          </div>
        )}

        {confirmCancel === appointment.id && (
          <div className="inline-confirm">
            <p>Отменить запись к врачу?</p>
            <div>
              <button className="btn btn-danger btn-sm" onClick={() => handleCancelAppointment(appointment.id)}>
                Да, отменить
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setConfirmCancel(null)}>
                Оставить запись
              </button>
            </div>
          </div>
        )}
      </article>
    );
  }

  if (authLoading || !user) {
    return (
      <div className="cabinet-container">
        <div className="loading-message">Загружаем кабинет...</div>
      </div>
    );
  }

  return (
    <div className="cabinet-container">
      <header className="cabinet-header">
        <div>
          <p className="eyebrow">Личный кабинет</p>
          <h1>Здравствуйте, {user.name}</h1>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Выйти
        </button>
      </header>

      {error && <div className="cabinet-error">{error}</div>}

      <nav className="cabinet-tabs" aria-label="Разделы кабинета">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`cabinet-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => {
              setActiveTab(tab.id);
              setEditing(false);
              setError('');
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <section className="cabinet-content">
        {loading && <div className="loading-message">Загрузка...</div>}

        {activeTab === 'upcoming' && !loading && (
          <div className="tab-section">
            <div className="section-heading">
              <h2>Предстоящие записи</h2>
              <Link to="/booking" className="btn btn-primary btn-sm">
                Новая запись
              </Link>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="appointments-list">
                {upcomingAppointments.map((appointment) => renderAppointmentCard(appointment, true))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Нет предстоящих записей</h3>
                <p>Выберите специалиста и удобное время приема.</p>
                <Link to="/booking" className="btn btn-primary">
                  Записаться к врачу
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && !loading && (
          <div className="tab-section">
            <h2>История посещений</h2>
            {historyAppointments.length > 0 ? (
              <div className="appointments-list">
                {historyAppointments.map((appointment) => renderAppointmentCard(appointment))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>История пока пуста</h3>
                <p>Завершенные и отмененные приемы появятся здесь.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'medcard' && !loading && (
          <div className="tab-section">
            <h2>Медицинская карта</h2>
            {medicalCard ? (
              <div className="medcard-content">
                <div className="medcard-section">
                  <h3>Основная информация</h3>
                  <div className="info-grid">
                    <div>
                      <span>Группа крови</span>
                      <strong>{medicalCard.bloodType || 'Не указана'}</strong>
                    </div>
                    <div>
                      <span>Полис</span>
                      <strong>{medicalCard.insuranceNumber || 'Не указан'}</strong>
                    </div>
                    <div>
                      <span>Аллергии</span>
                      <strong>{medicalCard.allergies || 'Не указаны'}</strong>
                    </div>
                    <div>
                      <span>Хронические заболевания</span>
                      <strong>{medicalCard.chronicDiseases || 'Не указаны'}</strong>
                    </div>
                  </div>
                </div>

                <div className="medcard-section">
                  <h3>Записи врача</h3>
                  {medicalCard.records.length > 0 ? (
                    <div className="records-list">
                      {medicalCard.records.map((record) => (
                        <article key={record.id} className="record-card">
                          <div className="record-header">
                            <span>{new Date(record.date).toLocaleDateString('ru-RU')}</span>
                            <strong>{record.doctorName}</strong>
                          </div>
                          <p><b>Диагноз:</b> {record.diagnosis || 'Не указан'}</p>
                          {record.treatment && <p><b>Лечение:</b> {record.treatment}</p>}
                          {record.prescriptions && <p><b>Назначения:</b> {record.prescriptions}</p>}
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="muted-text">Записей врача пока нет.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <h3>Медкарта не заполнена</h3>
                <p>Заполните профиль, чтобы основные медицинские данные были под рукой.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && !loading && (
          <div className="tab-section">
            <div className="section-heading">
              <h2>Мой профиль</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm">
                  Редактировать
                </button>
              )}
            </div>

            <div className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label>ФИО</label>
                  <input value={editedProfile.name} disabled />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={editedProfile.email} disabled />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Телефон</label>
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => handleProfileChange('phone', e.target.value)}
                    placeholder="+7 (999) 999-99-99"
                    disabled={!editing}
                  />
                </div>
                <div className="form-group">
                  <label>Дата рождения</label>
                  <input
                    type="date"
                    value={editedProfile.birthDate}
                    onChange={(e) => handleProfileChange('birthDate', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Группа крови</label>
                  <select
                    value={editedProfile.bloodType}
                    onChange={(e) => handleProfileChange('bloodType', e.target.value)}
                    disabled={!editing}
                  >
                    <option value="">Не указана</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Номер полиса</label>
                  <input
                    value={editedProfile.insuranceNumber}
                    onChange={(e) => handleProfileChange('insuranceNumber', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Аллергии</label>
                <textarea
                  value={editedProfile.allergies}
                  onChange={(e) => handleProfileChange('allergies', e.target.value)}
                  rows="3"
                  disabled={!editing}
                />
              </div>

              <div className="form-group">
                <label>Хронические заболевания</label>
                <textarea
                  value={editedProfile.chronicDiseases}
                  onChange={(e) => handleProfileChange('chronicDiseases', e.target.value)}
                  rows="3"
                  disabled={!editing}
                />
              </div>

              {editing && (
                <div className="profile-actions">
                  <button onClick={handleSaveProfile} className="btn btn-success">
                    Сохранить
                  </button>
                  <button
                    onClick={() => {
                      setEditedProfile(profile);
                      setEditing(false);
                    }}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Cabinet;
