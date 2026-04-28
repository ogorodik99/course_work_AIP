import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getSpecializations, getDoctors, getSlots, createAppointment } from '../api';

const Booking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check auth on mount
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Load specializations on mount
  useEffect(() => {
    const loadSpecializations = async () => {
      try {
        setLoading(true);
        const data = await getSpecializations();
        setSpecializations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSpecializations();
  }, []);

  // Load doctors when specialization changes
  useEffect(() => {
    if (!selectedSpec) return;

    const loadDoctors = async () => {
      try {
        setLoading(true);
        const data = await getDoctors(selectedSpec);
        setDoctors(data);
        setSelectedDoctor(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDoctors();
  }, [selectedSpec]);

  // Load slots when doctor and date change
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    const loadSlots = async () => {
      try {
        setLoading(true);
        const data = await getSlots(selectedDoctor, selectedDate);
        setSlots(data);
        setSelectedTime(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadSlots();
  }, [selectedDoctor, selectedDate]);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);
      await createAppointment({
        doctor_id: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        reason: '',
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setSelectedSpec(null);
    setSelectedDoctor(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setSuccess(false);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  if (success) {
    return (
      <div className="booking-container">
        <div className="success-screen">
          <i className="bi bi-check-circle" style={{ fontSize: '80px', color: '#27ae60' }}></i>
          <h2>Вы успешно записаны!</h2>
          <div className="success-buttons">
            <Link to="/cabinet" className="btn btn-success">
              Перейти в кабинет
            </Link>
            <button className="btn btn-secondary" onClick={resetWizard}>
              Записаться ещё
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-container">
      <div className="progress-bar">
        <div className="progress-steps">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="progress-step-wrapper">
              <div
                className={`progress-step ${
                  step < currentStep ? 'completed' : step === currentStep ? 'active' : 'upcoming'
                }`}
              >
                {step}
              </div>
              <span className="step-label">
                {
                  [
                    'Специальность',
                    'Врач',
                    'Дата и время',
                    'Подтверждение',
                  ][step - 1]
                }
              </span>
              {step < 4 && <div className="progress-line"></div>}
            </div>
          ))}
        </div>
      </div>

      <div className="booking-content">
        {error && <div className="error-message">{error}</div>}
        {loading && <div className="loading-message">Загрузка...</div>}

        {/* Step 1: Choose Specialization */}
        {currentStep === 1 && (
          <div className="booking-step">
            <h2>Выберите специальность</h2>
            <div className="selectable-grid">
              {specializations.map((spec) => (
                <div
                  key={spec.id}
                  className={`selectable-card ${selectedSpec === spec.id ? 'selected' : ''}`}
                  onClick={() => setSelectedSpec(spec.id)}
                >
                  <i className={`bi ${spec.icon || 'bi-stethoscope'}`}></i>
                  <h4>{spec.name}</h4>
                  <p>{spec.description}</p>
                </div>
              ))}
            </div>
            <div className="booking-buttons">
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedSpec || loading}
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Doctor */}
        {currentStep === 2 && (
          <div className="booking-step">
            <h2>Выберите врача</h2>
            <button className="btn btn-secondary btn-back" onClick={handleBack}>
              Назад
            </button>
            <div className="selectable-grid">
              {doctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className={`selectable-card ${selectedDoctor === doctor.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDoctor(doctor.id)}
                >
                  <h4>{doctor.name}</h4>
                  <p>{doctor.specialization}</p>
                  <p>Стаж: {doctor.experience} лет</p>
                  <p className="education">{doctor.education}</p>
                </div>
              ))}
            </div>
            <div className="booking-buttons">
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedDoctor || loading}
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Choose Date & Time */}
        {currentStep === 3 && (
          <div className="booking-step">
            <h2>Выберите дату и время</h2>
            <button className="btn btn-secondary btn-back" onClick={handleBack}>
              Назад
            </button>
            <div className="date-time-selection">
              <input
                type="date"
                min={getTodayDate()}
                value={selectedDate || ''}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
              {selectedDate && slots.length > 0 && (
                <div className="time-slots-grid">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(slot)}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
              {selectedDate && slots.length === 0 && (
                <p className="no-slots">Нет доступных слотов на выбранную дату</p>
              )}
            </div>
            <div className="booking-buttons">
              <button
                className="btn btn-primary"
                onClick={handleNext}
                disabled={!selectedDate || !selectedTime || loading}
              >
                Далее
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {currentStep === 4 && (
          <div className="booking-step">
            <h2>Подтверждение записи</h2>
            <button className="btn btn-secondary btn-back" onClick={handleBack}>
              Назад
            </button>
            <div className="confirm-card">
              <div className="confirm-item">
                <span className="confirm-label">Специальность:</span>
                <span className="confirm-value">
                  {specializations.find((s) => s.id === selectedSpec)?.name}
                </span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Врач:</span>
                <span className="confirm-value">
                  {doctors.find((d) => d.id === selectedDoctor)?.name}
                </span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Дата:</span>
                <span className="confirm-value">{selectedDate}</span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Время:</span>
                <span className="confirm-value">{selectedTime}</span>
              </div>
              <div className="confirm-item">
                <span className="confirm-label">Пациент:</span>
                <span className="confirm-value">{user?.name}</span>
              </div>
            </div>
            <div className="booking-buttons">
              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={loading}
              >
                Записаться
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Booking;
