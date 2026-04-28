import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllAppointments,
  cancelAppointment,
  getQueue,
  generateQueue,
  updateQueueStatus,
  getSchedule,
  getDoctors,
  addDoctor,
  getReports,
  getSpecializations,
} from '../api/index';
// styles loaded from global.css in main.jsx

const Admin = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Tab management
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data states
  const [appointments, setAppointments] = useState([]);
  const [queue, setQueue] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [reports, setReports] = useState(null);
  const [specializations, setSpecializations] = useState([]);

  // Filter/Form states
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newDoctor, setNewDoctor] = useState({
    name: '',
    specializationId: '',
    experience: '',
    education: '',
  });
  const [showAddDoctorForm, setShowAddDoctorForm] = useState(false);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState({});

  // Auth check
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (user.role !== 'admin') {
      navigate('/cabinet');
    }
  }, [user, navigate]);

  // Load data when tab changes
  useEffect(() => {
    loadTabData();
  }, [activeTab, appointmentDate]);

  const loadTabData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'appointments') {
        const data = await getAllAppointments(appointmentDate);
        setAppointments(data);
      } else if (activeTab === 'queue') {
        const data = await getQueue();
        setQueue(data);
      } else if (activeTab === 'schedule') {
        const data = await getSchedule();
        setSchedule(data);
      } else if (activeTab === 'doctors') {
        const specs = await getSpecializations();
        setSpecializations(specs);
        const docsData = await getDoctors('');
        setDoctors(docsData);
      } else if (activeTab === 'reports') {
        const data = await getReports();
        setReports(data);
      }
    } catch (err) {
      setError(err.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const handleGenerateQueue = async () => {
    try {
      setLoading(true);
      await generateQueue(appointmentDate);
      const data = await getQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message || 'Ошибка формирования очереди');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueAction = async (queueId, newStatus) => {
    try {
      setLoading(true);
      await updateQueueStatus(queueId, newStatus);
      const data = await getQueue();
      setQueue(data);
    } catch (err) {
      setError(err.message || 'Ошибка обновления статуса');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    try {
      setLoading(true);
      await cancelAppointment(appointmentId);
      const data = await getAllAppointments(appointmentDate);
      setAppointments(data);
    } catch (err) {
      setError(err.message || 'Ошибка отмены записи');
    } finally {
      setLoading(false);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.specializationId) {
      setError('Заполните все обязательные поля');
      return;
    }
    try {
      setLoading(true);
      await addDoctor(newDoctor);
      const docsData = await getDoctors('');
      setDoctors(docsData);
      setNewDoctor({ name: '', specializationId: '', experience: '', education: '' });
      setShowAddDoctorForm(false);
    } catch (err) {
      setError(err.message || 'Ошибка добавления врача');
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments.filter((apt) =>
      apt.date.startsWith(today)
    );
    return {
      totalAppointments: appointments.length,
      todayAppointments: todayAppointments.length,
      totalDoctors: doctors.length,
      totalPatients: new Set(appointments.map((apt) => apt.patientId)).size,
    };
  };

  const stats = getStats();

  return (
    <div className="admin-container">
      {/* Sidebar */}
      <aside className="admin-sidebar glass-card">
        <div className="admin-logo">Админ-панель</div>
        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <i className="bi bi-speedometer2"></i> Дашборд
          </button>
          <button
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <i className="bi bi-calendar-event"></i> Записи
          </button>
          <button
            className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            <i className="bi bi-people-fill"></i> Очередь
          </button>
          <button
            className={`nav-item ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <i className="bi bi-clock"></i> Расписание
          </button>
          <button
            className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <i className="bi bi-person-badge"></i> Врачи
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="bi bi-bar-chart"></i> Отчёты
          </button>
        </nav>
        <button className="btn btn-danger" onClick={handleLogout}>
          Выход
        </button>
      </aside>

      {/* Main Content */}
      <div className="admin-content">
        {error && <div className="alert alert-error">{error}</div>}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="tab-content">
            <h1>Дашборд</h1>
            <div className="stats-grid">
              <div className="stat-card glass-card">
                <div className="stat-number">{stats.totalAppointments}</div>
                <div className="stat-label">Всего записей</div>
                <i className="bi bi-calendar-check stat-icon"></i>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-number">{stats.todayAppointments}</div>
                <div className="stat-label">Записей сегодня</div>
                <i className="bi bi-calendar-day stat-icon"></i>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-number">{stats.totalDoctors}</div>
                <div className="stat-label">Врачей</div>
                <i className="bi bi-person-badge stat-icon"></i>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-number">{stats.totalPatients}</div>
                <div className="stat-label">Пациентов</div>
                <i className="bi bi-people stat-icon"></i>
              </div>
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="tab-content">
            <h1>Записи</h1>
            <div className="filter-section glass-card">
              <label>
                Дата:
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="form-input"
                />
              </label>
            </div>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
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
                  {appointments.map((apt) => (
                    <tr key={apt.id}>
                      <td>{apt.patientName}</td>
                      <td>{apt.doctorName}</td>
                      <td>{apt.specialization}</td>
                      <td>{apt.date}</td>
                      <td>{apt.time}</td>
                      <td>
                        <span className={`status-badge status-${apt.status}`}>
                          {apt.status === 'scheduled' && 'Запланирована'}
                          {apt.status === 'completed' && 'Завершена'}
                          {apt.status === 'cancelled' && 'Отменена'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleCancelAppointment(apt.id)}
                        >
                          Отменить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === 'queue' && (
          <div className="tab-content">
            <h1>Очередь</h1>
            <button className="btn btn-primary" onClick={handleGenerateQueue}>
              Сформировать очередь
            </button>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <div className="queue-list">
                {queue.map((item) => (
                  <div key={item.id} className="queue-card glass-card">
                    <div className="queue-info">
                      <div className="queue-number">№ {item.queueNumber}</div>
                      <div>
                        <strong>{item.patientName}</strong>
                        <p>Врач: {item.doctorName}</p>
                        <p>Время: {item.time}</p>
                        <p>
                          Статус:{' '}
                          <span className={`status-badge status-${item.status}`}>
                            {item.status === 'waiting' && 'Ожидает'}
                            {item.status === 'in_progress' && 'На приёме'}
                            {item.status === 'done' && 'Завершено'}
                            {item.status === 'skipped' && 'Пропущено'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="queue-actions">
                      {item.status === 'waiting' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleQueueAction(item.id, 'in_progress')}
                        >
                          Вызвать
                        </button>
                      )}
                      {item.status === 'in_progress' && (
                        <>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleQueueAction(item.id, 'done')}
                          >
                            Завершить
                          </button>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => handleQueueAction(item.id, 'skipped')}
                          >
                            Пропустить
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="tab-content">
            <h1>Расписание</h1>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Врач</th>
                    <th>День недели</th>
                    <th>Время начала</th>
                    <th>Время окончания</th>
                    <th>Длительность</th>
                    <th>Статус</th>
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
                          {item.status === 'active' && 'Активно'}
                          {item.status === 'inactive' && 'Неактивно'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="tab-content">
            <h1>Врачи</h1>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddDoctorForm(!showAddDoctorForm)}
            >
              Добавить врача
            </button>

            {showAddDoctorForm && (
              <div className="form-card glass-card">
                <h3>Форма добавления врача</h3>
                <form onSubmit={handleAddDoctor}>
                  <div className="form-group">
                    <label>ФИО:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDoctor.name}
                      onChange={(e) =>
                        setNewDoctor({ ...newDoctor, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Специальность:</label>
                    <select
                      className="form-input"
                      value={newDoctor.specializationId}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          specializationId: e.target.value,
                        })
                      }
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
                  <div className="form-group">
                    <label>Стаж (лет):</label>
                    <input
                      type="number"
                      className="form-input"
                      value={newDoctor.experience}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          experience: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Образование:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDoctor.education}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          education: e.target.value,
                        })
                      }
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">
                    Добавить
                  </button>
                </form>
              </div>
            )}

            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Специальность</th>
                    <th>Стаж</th>
                    <th>Образование</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => (
                    <tr key={doctor.id}>
                      <td>{doctor.name}</td>
                      <td>{doctor.specialization}</td>
                      <td>{doctor.experience} лет</td>
                      <td>{doctor.education}</td>
                      <td>
                        <span className={`status-badge status-${doctor.status}`}>
                          {doctor.status === 'active' && 'Активен'}
                          {doctor.status === 'inactive' && 'Неактивен'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="tab-content">
            <h1>Отчёты</h1>
            {loading ? (
              <p>Загрузка...</p>
            ) : reports ? (
              <>
                <div className="report-section">
                  <h3>По врачам</h3>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Врач</th>
                        <th>Всего записей</th>
                        <th>Выполненных</th>
                        <th>Процент</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.byDoctors?.map((item) => (
                        <tr key={item.doctorId}>
                          <td>{item.doctorName}</td>
                          <td>{item.total}</td>
                          <td>{item.completed}</td>
                          <td>{item.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="report-section">
                  <h3>По специальностям</h3>
                  <div className="report-bars">
                    {reports.bySpecializations?.map((item) => {
                      const maxCount = Math.max(
                        ...reports.bySpecializations.map((s) => s.count)
                      );
                      const percentage = (item.count / maxCount) * 100;
                      return (
                        <div key={item.specializationId} className="report-bar">
                          <div className="bar-label">{item.name}</div>
                          <div className="bar-container">
                            <div
                              className="bar-fill"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="bar-count">{item.count}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>

      <style>{`
        .admin-container {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .admin-sidebar {
          position: fixed;
          left: 0;
          top: 0;
          width: 240px;
          height: 100vh;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-right: 1px solid rgba(255, 255, 255, 0.2);
          padding: 20px;
          display: flex;
          flex-direction: column;
          z-index: 100;
          overflow-y: auto;
        }

        .admin-logo {
          font-size: 18px;
          font-weight: bold;
          color: white;
          margin-bottom: 30px;
          text-align: center;
        }

        .admin-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .nav-item {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.8);
          padding: 12px 15px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          transition: all 0.3s ease;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .nav-item.active {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
        }

        .admin-content {
          margin-left: 260px;
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }

        .tab-content {
          max-width: 1200px;
        }

        .tab-content h1 {
          color: white;
          margin-bottom: 25px;
          font-size: 28px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          padding: 30px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          color: white;
          text-align: center;
        }

        .stat-number {
          font-size: 36px;
          font-weight: bold;
          margin-bottom: 10px;
        }

        .stat-label {
          font-size: 14px;
          opacity: 0.9;
        }

        .stat-icon {
          position: absolute;
          top: 15px;
          right: 15px;
          font-size: 24px;
          opacity: 0.6;
        }

        .filter-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 20px;
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .filter-section label {
          color: white;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .form-input {
          padding: 10px 15px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 14px;
        }

        .form-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          color: white;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .data-table thead {
          background: rgba(255, 255, 255, 0.15);
        }

        .data-table th {
          padding: 15px;
          text-align: left;
          font-weight: 600;
        }

        .data-table td {
          padding: 15px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .data-table tbody tr:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-scheduled {
          background: rgba(100, 200, 255, 0.3);
          color: #64c8ff;
        }

        .status-completed {
          background: rgba(50, 200, 100, 0.3);
          color: #32c864;
        }

        .status-cancelled {
          background: rgba(255, 100, 100, 0.3);
          color: #ff6464;
        }

        .status-waiting {
          background: rgba(255, 200, 100, 0.3);
          color: #ffc864;
        }

        .status-in_progress {
          background: rgba(100, 150, 255, 0.3);
          color: #6496ff;
        }

        .status-done {
          background: rgba(100, 255, 100, 0.3);
          color: #64ff64;
        }

        .status-skipped {
          background: rgba(150, 150, 150, 0.3);
          color: #aaaaaa;
        }

        .status-active {
          background: rgba(100, 255, 100, 0.3);
          color: #64ff64;
        }

        .status-inactive {
          background: rgba(150, 150, 150, 0.3);
          color: #aaaaaa;
        }

        .queue-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .queue-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .queue-info {
          flex: 1;
        }

        .queue-number {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #64c8ff;
        }

        .queue-card p {
          margin: 5px 0;
          font-size: 13px;
          opacity: 0.9;
        }

        .queue-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.1);
          padding: 25px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin: 20px 0;
          color: white;
          max-width: 500px;
        }

        .form-card h3 {
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .report-section {
          margin-bottom: 40px;
        }

        .report-section h3 {
          color: white;
          margin-bottom: 20px;
        }

        .report-bars {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .report-bar {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .bar-label {
          color: white;
          min-width: 150px;
          font-weight: 500;
        }

        .bar-container {
          flex: 1;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          transition: width 0.3s ease;
        }

        .bar-count {
          color: white;
          font-weight: 600;
          min-width: 50px;
          text-align: right;
        }

        .alert {
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 8px;
          font-weight: 500;
        }

        .alert-error {
          background: rgba(255, 100, 100, 0.2);
          color: #ff6464;
          border: 1px solid rgba(255, 100, 100, 0.4);
        }

        @media (max-width: 768px) {
          .admin-sidebar {
            width: 60px;
            padding: 15px;
          }

          .admin-logo {
            font-size: 12px;
            margin-bottom: 20px;
          }

          .nav-item {
            padding: 10px;
            justify-content: center;
          }

          .admin-content {
            margin-left: 80px;
            padding: 20px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default Admin;
