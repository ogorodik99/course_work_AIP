const BASE = '/backend/api';

async function request(url, options = {}) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const json = await res.json();
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

// ─── Авторизация ────────────────────────────────────────────
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

// ─── Специальности ──────────────────────────────────────────
export function getSpecializations() {
  return request(`${BASE}/specializations.php`);
}

// ─── Врачи ──────────────────────────────────────────────────
export function getDoctors(specId) {
  const q = specId ? `?specialization_id=${specId}` : '';
  return request(`${BASE}/doctors.php${q}`);
}

export function addDoctor(data) {
  return post(`${BASE}/doctors.php`, data);
}

// ─── Записи на приём ────────────────────────────────────────
export function getMyAppointments() {
  return request(`${BASE}/appointments.php?action=my`);
}

export function getAllAppointments(date) {
  return request(`${BASE}/appointments.php?action=all&date=${date || ''}`);
}

export function getSlots(doctorId, date) {
  return request(`${BASE}/appointments.php?action=slots&doctor_id=${doctorId}&date=${date}`);
}

export function createAppointment({ doctor_id, date, time, reason }) {
  return post(`${BASE}/appointments.php`, { doctor_id, date, time, reason });
}

export function updateAppointmentStatus(id, status, notes) {
  return put(`${BASE}/appointments.php`, { id, status, notes });
}

export function cancelAppointment(id) {
  return put(`${BASE}/appointments.php`, { id, status: 'cancelled' });
}

// ─── Очередь ────────────────────────────────────────────────
export function getQueue() {
  return request(`${BASE}/queue.php`);
}

export function generateQueue() {
  return post(`${BASE}/queue.php`, {});
}

export function updateQueueStatus(id, status) {
  return put(`${BASE}/queue.php`, { id, status });
}

// ─── Расписание ─────────────────────────────────────────────
export function getSchedule(doctorId) {
  const q = doctorId ? `?doctor_id=${doctorId}` : '';
  return request(`${BASE}/schedule.php${q}`);
}

// ─── Медкарта ───────────────────────────────────────────────
export function getMedicalCard() {
  return request(`${BASE}/medical_card.php`);
}

export function updateMedicalCard(data) {
  return put(`${BASE}/medical_card.php`, data);
}

// ─── Профиль ────────────────────────────────────────────────
export function updateProfile(data) {
  return put(`${BASE}/medical_card.php`, data);
}

// ─── Отчёты ─────────────────────────────────────────────────
export function getReports() {
  return request(`${BASE}/reports.php`);
}
