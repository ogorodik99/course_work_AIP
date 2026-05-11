import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addDoctor,
  deleteSchedule,
  exportBackup,
  generateQueue,
  getAllAppointments,
  getDoctors,
  getQueue,
  getReports,
  getSchedule,
  getSpecializations,
  saveSchedule,
  statusLabel,
  updateAppointmentStatus,
  updateQueueStatus,
} from '../api/index';

const navItems = [
  { id: 'dashboard', label: 'Дашборд' },
  { id: 'appointments', label: 'Записи' },
  { id: 'queue', label: 'Очередь' },
  { id: 'schedule', label: 'Расписание' },
  { id: 'doctors', label: 'Врачи' },
  { id: 'reports', label: 'Отчеты' },
];

const days = [
  { value: '1', label: 'Понедельник' },
  { value: '2', label: 'Вторник' },
  { value: '3', label: 'Среда' },
  { value: '4', label: 'Четверг' },
  { value: '5', label: 'Пятница' },
  { value: '6', label: 'Суббота' },
  { value: '7', label: 'Воскресенье' },
];

const defaultDoctor = {
  name: '',
  specializationId: '',
  experience: '',
  education: '',
  phone: '',
  cabinet: '',
};

const defaultSchedule = {
  doctorId: '',
  dayOfWeek: '1',
  startTime: '09:00',
  endTime: '15:00',
  duration: 30,
};

function localDate() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

function formatDate(date) {
  return date ? new Date(`${date}T00:00`).toLocaleDateString('ru-RU') : '';
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [appointmentDate, setAppointmentDate] = useState(localDate());
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [reports, setReports] = useState(null);

  const [newDoctor, setNewDoctor] = useState(defaultDoctor);
  const [newSchedule, setNewSchedule] = useState(defaultSchedule);
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/auth');
    } else if (user.role !== 'admin') {
      navigate('/cabinet');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && user?.role === 'admin') {
      loadTabData();
    }
  }, [activeTab, appointmentDate, authLoading, user?.id]);

  const summaryStats = useMemo(() => {
    const summary = reports?.summary || {};
    return [
      { label: 'Всего записей', value: summary.total_appointments ?? appointments.length },
      { label: 'Сегодня', value: summary.today_appointments ?? 0 },
      { label: 'Пациентов', value: summary.total_patients ?? 0 },
      { label: 'Врачей', value: doctors.length },
    ];
  }, [appointments.length, doctors.length, reports]);

  async function loadTabData() {
    setLoading(true);
    setError('');

    try {
      if (activeTab === 'dashboard') {
        const [reportData, doctorsData, appointmentsData] = await Promise.all([
          getReports(),
          getDoctors(),
          getAllAppointments(appointmentDate),
        ]);
        setReports(reportData);
        setDoctors(doctorsData);
        setAppointments(appointmentsData);
      }

      if (activeTab === 'appointments') {
        setAppointments(await getAllAppointments(appointmentDate));
      }

      if (activeTab === 'queue') {
        setQueue(await getQueue(appointmentDate));
      }

      if (activeTab === 'schedule') {
        const [scheduleData, doctorsData] = await Promise.all([getSchedule(), getDoctors()]);
        setSchedule(scheduleData);
        setDoctors(doctorsData);
      }

      if (activeTab === 'doctors') {
        const [specs, doctorsData] = await Promise.all([getSpecializations(), getDoctors()]);
        setSpecializations(specs);
        setDoctors(doctorsData);
      }

      if (activeTab === 'reports') {
        setReports(await getReports());
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/auth');
  }

  async function handleAppointmentStatus(appointmentId, status) {
    try {
      setLoading(true);
      await updateAppointmentStatus(appointmentId, status);
      setAppointments(await getAllAppointments(appointmentDate));
    } catch (err) {
      setError(err.message || 'Ошибка обновления записи');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateQueue() {
    try {
      setLoading(true);
      await generateQueue(appointmentDate);
      setQueue(await getQueue(appointmentDate));
    } catch (err) {
      setError(err.message || 'Ошибка формирования очереди');
    } finally {
      setLoading(false);
    }
  }

  async function handleQueueAction(queueId, newStatus) {
    try {
      setLoading(true);
      await updateQueueStatus(queueId, newStatus);
      setQueue(await getQueue(appointmentDate));
    } catch (err) {
      setError(err.message || 'Ошибка обновления очереди');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddDoctor(event) {
    event.preventDefault();
    if (!newDoctor.name.trim() || !newDoctor.specializationId) {
      setError('Заполните ФИО и специальность врача');
      return;
    }

    try {
      setLoading(true);
      await addDoctor(newDoctor);
      setDoctors(await getDoctors());
      setNewDoctor(defaultDoctor);
      setShowAddDoctorForm(false);
    } catch (err) {
      setError(err.message || 'Ошибка добавления врача');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSchedule(event) {
    event.preventDefault();
    if (!newSchedule.doctorId || !newSchedule.dayOfWeek) {
      setError('Выберите врача и день недели');
      return;
    }
    if (newSchedule.startTime >= newSchedule.endTime) {
      setError('Время окончания должно быть позже времени начала');
      return;
    }

    try {
      setLoading(true);
      await saveSchedule(newSchedule);
      setSchedule(await getSchedule());
      setNewSchedule(defaultSchedule);
      setShowScheduleForm(false);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения расписания');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteSchedule(scheduleId) {
    try {
      setLoading(true);
      await deleteSchedule(scheduleId);
      setSchedule(await getSchedule());
    } catch (err) {
      setError(err.message || 'Ошибка удаления расписания');
    } finally {
      setLoading(false);
    }
  }

  async function handleExportBackup() {
    try {
      const blob = await exportBackup();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `medzap-backup-${localDate()}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Ошибка создания резервной копии');
    }
  }

  function renderEmpty(message) {
    return (
      <div className="empty-state compact">
        <h3>{message}</h3>
      </div>
    );
  }

  if (authLoading || !user) {
    return (
      <div className="admin-container">
        <div className="loading-message">Загружаем админ-панель...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">МедЗапись</div>
        <nav className="admin-nav" aria-label="Админ-разделы">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={activeTab === item.id ? 'active' : ''}
              onClick={() => {
                setActiveTab(item.id);
                setError('');
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Выйти
        </button>
      </aside>

      <main className="admin-content">
        <div className="admin-topbar">
          <div>
            <p className="eyebrow">Администрирование</p>
            <h1>{navItems.find((item) => item.id === activeTab)?.label}</h1>
          </div>
          {(activeTab === 'appointments' || activeTab === 'queue') && (
            <label className="date-filter">
              Дата
              <input
                type="date"
                value={appointmentDate}
                onChange={(event) => setAppointmentDate(event.target.value)}
              />
            </label>
          )}
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {loading && <div className="loading-message">Загрузка...</div>}

        {activeTab === 'dashboard' && !loading && (
          <section className="tab-content">
            <div className="stats-grid">
              {summaryStats.map((item) => (
                <article key={item.label} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="dashboard-grid">
              <div className="panel">
                <h2>Записи на {formatDate(appointmentDate)}</h2>
                {appointments.length > 0 ? (
                  <div className="mini-list">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id}>
                        <strong>{appointment.time}</strong>
                        <span>{appointment.patientName}</span>
                        <small>{appointment.doctorName}</small>
                      </div>
                    ))}
                  </div>
                ) : (
                  renderEmpty('На выбранную дату записей нет')
                )}
              </div>

              <div className="panel">
                <h2>Выполнение приемов</h2>
                <div className="report-bars">
                  {(reports?.byDoctors || []).slice(0, 5).map((item) => (
                    <div key={item.doctorName} className="report-bar">
                      <span>{item.doctorName}</span>
                      <div className="bar-track">
                        <div style={{ width: `${item.percentage}%` }} />
                      </div>
                      <strong>{item.percentage}%</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'appointments' && !loading && (
          <section className="tab-content">
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Пациент</th>
                    <th>Врач</th>
                    <th>Специальность</th>
                    <th>Дата</th>
                    <th>Время</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.patientName}</td>
                      <td>{appointment.doctorName}</td>
                      <td>{appointment.specialization}</td>
                      <td>{formatDate(appointment.date)}</td>
                      <td>{appointment.time}</td>
                      <td>
                        <span className={`status-badge status-${appointment.status}`}>
                          {appointment.statusLabel}
                        </span>
                      </td>
                      <td>
                        <select
                          value={appointment.status}
                          onChange={(event) => handleAppointmentStatus(appointment.id, event.target.value)}
                        >
                          <option value="pending">Ожидает</option>
                          <option value="confirmed">Запланирована</option>
                          <option value="completed">Завершена</option>
                          <option value="cancelled">Отменена</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {appointments.length === 0 && renderEmpty('Записей на выбранную дату нет')}
          </section>
        )}

        {activeTab === 'queue' && !loading && (
          <section className="tab-content">
            <div className="toolbar">
              <button className="btn btn-primary" onClick={handleGenerateQueue}>
                Сформировать очередь
              </button>
              <span className="muted-text">Дата очереди: {formatDate(appointmentDate)}</span>
            </div>

            {queue.length > 0 ? (
              <div className="queue-list">
                {queue.map((item) => (
                  <article key={item.id} className="queue-card">
                    <div className="queue-number">{item.queueNumber}</div>
                    <div className="queue-info">
                      <strong>{item.patientName}</strong>
                      <span>{item.doctorName}</span>
                      <small>{item.time}{item.cabinet ? `, кабинет ${item.cabinet}` : ''}</small>
                    </div>
                    <span className={`status-badge status-${item.status}`}>{item.statusLabel}</span>
                    <div className="queue-actions">
                      {item.status === 'waiting' && (
                        <button className="btn btn-primary btn-sm" onClick={() => handleQueueAction(item.id, 'in_progress')}>
                          Вызвать
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => handleQueueAction(item.id, 'done')}>
                            Завершить
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleQueueAction(item.id, 'skipped')}>
                            Пропустить
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              renderEmpty('Очередь на выбранную дату пока не сформирована')
            )}
          </section>
        )}

        {activeTab === 'schedule' && !loading && (
          <section className="tab-content">
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => setShowScheduleForm((value) => !value)}>
                {showScheduleForm ? 'Скрыть форму' : 'Добавить расписание'}
              </button>
            </div>

            {showScheduleForm && (
              <form className="form-card" onSubmit={handleSaveSchedule}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Врач</label>
                    <select
                      value={newSchedule.doctorId}
                      onChange={(event) => setNewSchedule({ ...newSchedule, doctorId: event.target.value })}
                      required
                    >
                      <option value="">Выберите врача</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>День недели</label>
                    <select
                      value={newSchedule.dayOfWeek}
                      onChange={(event) => setNewSchedule({ ...newSchedule, dayOfWeek: event.target.value })}
                    >
                      {days.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Начало</label>
                    <input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(event) => setNewSchedule({ ...newSchedule, startTime: event.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Окончание</label>
                    <input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(event) => setNewSchedule({ ...newSchedule, endTime: event.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Интервал, мин</label>
                    <input
                      type="number"
                      min="10"
                      max="120"
                      value={newSchedule.duration}
                      onChange={(event) => setNewSchedule({ ...newSchedule, duration: event.target.value })}
                    />
                  </div>
                </div>

                <button className="btn btn-success" type="submit">
                  Сохранить расписание
                </button>
              </form>
            )}

            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Врач</th>
                    <th>День</th>
                    <th>Начало</th>
                    <th>Окончание</th>
                    <th>Интервал</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr key={item.id}>
                      <td>{item.doctorName}</td>
                      <td>{item.dayOfWeek}</td>
                      <td>{item.startTime}</td>
                      <td>{item.endTime}</td>
                      <td>{item.duration} мин</td>
                      <td>
                        <span className={`status-badge status-${item.status}`}>
                          {statusLabel(item.status)}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSchedule(item.id)}>
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {schedule.length === 0 && renderEmpty('Расписание пока не заполнено')}
          </section>
        )}

        {activeTab === 'doctors' && !loading && (
          <section className="tab-content">
            <div className="toolbar">
              <button className="btn btn-primary" onClick={() => setShowAddDoctorForm((value) => !value)}>
                {showAddDoctorForm ? 'Скрыть форму' : 'Добавить врача'}
              </button>
            </div>

            {showAddDoctorForm && (
              <form className="form-card" onSubmit={handleAddDoctor}>
                <div className="form-row">
                  <div className="form-group">
                    <label>ФИО</label>
                    <input
                      value={newDoctor.name}
                      onChange={(event) => setNewDoctor({ ...newDoctor, name: event.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Специальность</label>
                    <select
                      value={newDoctor.specializationId}
                      onChange={(event) => setNewDoctor({ ...newDoctor, specializationId: event.target.value })}
                      required
                    >
                      <option value="">Выберите специальность</option>
                      {specializations.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Стаж</label>
                    <input
                      type="number"
                      min="0"
                      value={newDoctor.experience}
                      onChange={(event) => setNewDoctor({ ...newDoctor, experience: event.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Кабинет</label>
                    <input
                      value={newDoctor.cabinet}
                      onChange={(event) => setNewDoctor({ ...newDoctor, cabinet: event.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Образование</label>
                  <input
                    value={newDoctor.education}
                    onChange={(event) => setNewDoctor({ ...newDoctor, education: event.target.value })}
                  />
                </div>

                <button className="btn btn-success" type="submit">
                  Добавить врача
                </button>
              </form>
            )}

            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Специальность</th>
                    <th>Стаж</th>
                    <th>Кабинет</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.experience} лет</td>
                      <td>{doctor.cabinet || '-'}</td>
                      <td>
                        <span className={`status-badge status-${doctor.status}`}>
                          {statusLabel(doctor.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {doctors.length === 0 && renderEmpty('Врачи пока не добавлены')}
          </section>
        )}

        {activeTab === 'reports' && !loading && (
          <section className="tab-content">
            {reports ? (
              <>
                <div className="toolbar">
                  <button className="btn btn-secondary" onClick={handleExportBackup}>
                    Скачать резервную копию
                  </button>
                </div>

                <div className="stats-grid">
                  <article className="stat-card">
                    <strong>{reports.summary.total_appointments}</strong>
                    <span>Всего записей</span>
                  </article>
                  <article className="stat-card">
                    <strong>{reports.summary.completed_appointments}</strong>
                    <span>Завершено</span>
                  </article>
                  <article className="stat-card">
                    <strong>{reports.summary.cancelled_appointments}</strong>
                    <span>Отменено</span>
                  </article>
                  <article className="stat-card">
                    <strong>{reports.summary.total_patients}</strong>
                    <span>Пациентов</span>
                  </article>
                </div>

                <div className="dashboard-grid">
                  <div className="panel">
                    <h2>Работа врачей</h2>
                    <div className="table-card flat">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Врач</th>
                            <th>Всего</th>
                            <th>Завершено</th>
                            <th>Процент</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.byDoctors.map((item) => (
                            <tr key={item.doctorName}>
                              <td>{item.doctorName}</td>
                              <td>{item.total}</td>
                              <td>{item.completed}</td>
                              <td>{item.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="panel">
                    <h2>Популярность специальностей</h2>
                    <div className="report-bars">
                      {reports.bySpecializations.map((item) => {
                        const max = Math.max(...reports.bySpecializations.map((spec) => spec.count), 1);
                        return (
                          <div key={item.name} className="report-bar">
                            <span>{item.name}</span>
                            <div className="bar-track">
                              <div style={{ width: `${(item.count / max) * 100}%` }} />
                            </div>
                            <strong>{item.count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              renderEmpty('Отчеты пока недоступны')
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Admin;
