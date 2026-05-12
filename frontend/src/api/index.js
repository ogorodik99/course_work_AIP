const BASE = 'http://localhost:8000/api';

async function request(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const text = await res.text();
  let json = {};

  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || 'Backend вернул некорректный ответ');
  }

  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Ошибка ${res.status}`);
  }

  return json;
}

function post(url, body) {
  return request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function put(url, body) {
  return request(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function del(url, body) {
  return request(url, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function dataOf(response) {
  return response?.data ?? response;
}

function listOf(response) {
  const data = dataOf(response);
  return Array.isArray(data) ? data : [];
}

function asId(value) {
  const number = Number(value);
  return Number.isNaN(number) ? value : number;
}

function shortTime(value = '') {
  return String(value).slice(0, 5);
}

function statusLabel(status) {
  const labels = {
    pending: 'Ожидает подтверждения',
    confirmed: 'Запланирована',
    scheduled: 'Запланирована',
    completed: 'Завершена',
    cancelled: 'Отменена',
    waiting: 'Ожидает',
    in_progress: 'На приеме',
    done: 'Завершено',
    skipped: 'Пропущено',
    active: 'Активно',
    inactive: 'Неактивно',
  };
  return labels[status] || status || 'Неизвестно';
}

function normalizeSpecialization(item) {
  return {
    ...item,
    id: asId(item.id),
    name: item.name || 'Специальность',
    description: item.description || '',
    iconUrl: item.icon_url || item.iconUrl || '',
  };
}

function normalizeDoctor(item) {
  return {
    ...item,
    id: asId(item.id),
    name: item.full_name || item.name || 'Врач',
    specializationId: asId(item.specialization_id ?? item.specializationId),
    specialization: item.specialization_name || item.specialization || '',
    experience: Number(item.experience_years ?? item.experience ?? 0),
    education: item.education || '',
    cabinet: item.cabinet || '',
    phone: item.phone || '',
    status: Number(item.is_active ?? 1) === 1 ? 'active' : 'inactive',
  };
}

function normalizeSlot(item) {
  if (typeof item === 'string') {
    return { value: item, label: shortTime(item), available: true };
  }

  const value = item.time || item.value || '';
  return {
    ...item,
    value,
    label: item.time_short || item.label || shortTime(value),
    available: item.available !== false,
  };
}

function normalizeAppointment(item) {
  const date = item.appointment_date || item.date || '';
  const time = item.appointment_time || item.time || '';
  const status = item.status || 'pending';

  return {
    ...item,
    id: asId(item.id),
    patientId: asId(item.patient_id ?? item.patientId),
    doctorId: asId(item.doctor_id ?? item.doctorId),
    patientName: item.patient_name || item.patientName || '',
    patientPhone: item.patient_phone || item.patientPhone || '',
    doctorName: item.doctor_name || item.doctorName || '',
    specialization: item.specialization_name || item.specialization || '',
    cabinet: item.cabinet || '',
    date,
    time: shortTime(time),
    rawTime: time,
    dateTime: date && time ? `${date}T${shortTime(time)}` : date,
    status,
    statusLabel: statusLabel(status),
    reason: item.reason || '',
    notes: item.notes || '',
    reminderAt: item.remind_at || item.reminderAt || '',
    reminderMethods: item.reminder_methods || item.reminderMethods || '',
  };
}

function normalizeQueueItem(item) {
  return {
    ...item,
    id: asId(item.id),
    appointmentId: asId(item.appointment_id ?? item.appointmentId),
    queueNumber: item.queue_number ?? item.queueNumber,
    patientName: item.patient_name || item.patientName || '',
    doctorName: item.doctor_name || item.doctorName || '',
    specialization: item.specialization_name || item.specialization || '',
    date: item.appointment_date || item.date || '',
    time: shortTime(item.appointment_time || item.time || ''),
    cabinet: item.cabinet || '',
    status: item.status || 'waiting',
    statusLabel: statusLabel(item.status || 'waiting'),
  };
}

function normalizeScheduleItem(item) {
  return {
    ...item,
    id: asId(item.id),
    doctorId: asId(item.doctor_id ?? item.doctorId),
    doctorName: item.doctor_name || item.doctorName || '',
    specialization: item.specialization_name || item.specialization || '',
    dayNumber: Number(item.day_of_week ?? item.dayNumber ?? 1),
    dayOfWeek: item.day_name || item.dayOfWeek || '',
    startTime: shortTime(item.start_time || item.startTime || ''),
    endTime: shortTime(item.end_time || item.endTime || ''),
    duration: Number(item.slot_duration ?? item.duration ?? 30),
    status: Number(item.is_active ?? 1) === 1 ? 'active' : 'inactive',
  };
}

function normalizeMedicalCard(response) {
  const card = response?.card || dataOf(response) || {};
  const records = response?.records || card.records || [];

  return {
    ...card,
    id: asId(card.id),
    patientId: asId(card.patient_id ?? card.patientId),
    fullName: card.full_name || card.fullName || '',
    phone: card.phone || '',
    email: card.email || '',
    birthDate: card.birth_date || card.birthDate || '',
    bloodType: card.blood_type || card.bloodType || '',
    allergies: card.allergies || '',
    chronicDiseases: card.chronic_diseases || card.chronicDiseases || '',
    insuranceNumber: card.insurance_number || card.insuranceNumber || '',
    records: records.map((record) => ({
      ...record,
      id: asId(record.id),
      doctorName: record.doctor_name || record.doctorName || '',
      specialization: record.specialization_name || record.specialization || '',
      date: record.record_date || record.date || '',
      prescriptions: record.prescriptions || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
    })),
  };
}

function medicalCardPayload(data) {
  const payload = {};

  if ('fullName' in data || 'full_name' in data || 'name' in data) {
    payload.full_name = data.fullName ?? data.full_name ?? data.name;
  }
  if ('phone' in data) payload.phone = data.phone;
  if ('birthDate' in data || 'birth_date' in data) payload.birth_date = data.birthDate ?? data.birth_date;
  if ('bloodType' in data || 'blood_type' in data) payload.blood_type = data.bloodType ?? data.blood_type;
  if ('allergies' in data) payload.allergies = data.allergies;
  if ('chronicDiseases' in data || 'chronic_diseases' in data) {
    payload.chronic_diseases = data.chronicDiseases ?? data.chronic_diseases;
  }
  if ('insuranceNumber' in data || 'insurance_number' in data) {
    payload.insurance_number = data.insuranceNumber ?? data.insurance_number;
  }

  return payload;
}

// Авторизация
export function checkSession() {
  return request(`${BASE}/auth.php?action=check`);
}

export function login(email, password) {
  return post(`${BASE}/auth.php`, { action: 'login', email, password });
}

export function register(name, email, password) {
  return post(`${BASE}/auth.php`, { action: 'register', name, email, password });
}

export function logout() {
  return request(`${BASE}/auth.php?action=logout`);
}

// Специальности
export async function getSpecializations() {
  const response = await request(`${BASE}/specializations.php`);
  return listOf(response).map(normalizeSpecialization);
}

// Врачи
export async function getDoctors(specId) {
  const q = specId ? `?specialization_id=${encodeURIComponent(specId)}` : '';
  const response = await request(`${BASE}/doctors.php${q}`);
  return listOf(response).map(normalizeDoctor);
}

export function addDoctor(data) {
  return post(`${BASE}/doctors.php`, {
    full_name: data.name ?? data.full_name,
    specialization_id: data.specializationId ?? data.specialization_id,
    experience_years: data.experience ?? data.experience_years ?? 0,
    education: data.education ?? '',
    phone: data.phone ?? '',
    cabinet: data.cabinet ?? '',
  });
}

// Записи на прием
export async function getMyAppointments() {
  const response = await request(`${BASE}/appointments.php?action=my`);
  return listOf(response).map(normalizeAppointment);
}

export async function getAllAppointments(date) {
  const q = date ? `&date=${encodeURIComponent(date)}` : '';
  const response = await request(`${BASE}/appointments.php?action=all${q}`);
  return listOf(response).map(normalizeAppointment);
}

export async function getSlots(doctorId, date) {
  const response = await request(
    `${BASE}/appointments.php?action=slots&doctor_id=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`
  );
  return listOf(response).map(normalizeSlot).filter((slot) => slot.available);
}

export function createAppointment({ doctor_id, date, time, reason }) {
  return post(`${BASE}/appointments.php`, { doctor_id, date, time, reason });
}

export function updateAppointmentStatus(id, status, notes = '') {
  return put(`${BASE}/appointments.php`, { id, status, notes });
}

export function cancelAppointment(id) {
  return put(`${BASE}/appointments.php`, { id, status: 'cancelled' });
}

// Очередь
export async function getQueue(date) {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const response = await request(`${BASE}/queue.php${q}`);
  return listOf(response).map(normalizeQueueItem);
}

export function generateQueue(date) {
  return post(`${BASE}/queue.php`, { date });
}

export function updateQueueStatus(id, status) {
  return put(`${BASE}/queue.php`, { id, status });
}

// Расписание
export async function getSchedule(doctorId) {
  const q = doctorId ? `?doctor_id=${encodeURIComponent(doctorId)}` : '';
  const response = await request(`${BASE}/schedule.php${q}`);
  return listOf(response).map(normalizeScheduleItem);
}

export function saveSchedule(data) {
  return post(`${BASE}/schedule.php`, {
    doctor_id: data.doctorId ?? data.doctor_id,
    day_of_week: data.dayOfWeek ?? data.day_of_week,
    start_time: data.startTime ?? data.start_time,
    end_time: data.endTime ?? data.end_time,
    slot_duration: data.duration ?? data.slot_duration ?? 30,
  });
}

export function deleteSchedule(id) {
  return del(`${BASE}/schedule.php`, { id });
}

// Медкарта и профиль
export async function getMedicalCard() {
  const response = await request(`${BASE}/medical_card.php`);
  return normalizeMedicalCard(response);
}

export function updateMedicalCard(data) {
  return put(`${BASE}/medical_card.php`, medicalCardPayload(data));
}

export function updateProfile(data) {
  return updateMedicalCard(data);
}

// Отчеты
export async function getReports() {
  const [summaryResponse, doctorsResponse, specializationsResponse, dailyResponse] = await Promise.all([
    request(`${BASE}/reports.php?action=summary`),
    request(`${BASE}/reports.php?action=doctors`),
    request(`${BASE}/reports.php?action=specializations`),
    request(`${BASE}/reports.php?action=daily&days=14`),
  ]);

  const byDoctors = listOf(doctorsResponse).map((item, index) => {
    const total = Number(item.total_appointments ?? item.total ?? 0);
    const completed = Number(item.completed ?? 0);
    return {
      doctorId: index + 1,
      doctorName: item.full_name || item.doctorName || '',
      specialization: item.specialization || '',
      total,
      completed,
      cancelled: Number(item.cancelled ?? 0),
      percentage: total ? Math.round((completed / total) * 100) : 0,
    };
  });

  return {
    summary: dataOf(summaryResponse) || {},
    byDoctors,
    bySpecializations: listOf(specializationsResponse).map((item, index) => ({
      specializationId: index + 1,
      name: item.name,
      count: Number(item.count ?? 0),
    })),
    daily: listOf(dailyResponse).map((item) => ({
      date: item.date,
      count: Number(item.count ?? 0),
    })),
  };
}

export async function exportBackup() {
  const res = await fetch(`${BASE}/backup.php`, { credentials: 'include' });
  const text = await res.text();

  if (!res.ok) {
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || 'Не удалось создать резервную копию');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(text || 'Не удалось создать резервную копию');
      }
      throw error;
    }
  }

  return new Blob([text], { type: 'application/json;charset=utf-8' });
}

export { statusLabel };
