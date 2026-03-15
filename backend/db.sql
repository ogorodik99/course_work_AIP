-- ============================================
-- База данных: Система записи к врачу «МедЗапись»
-- ============================================

CREATE DATABASE IF NOT EXISTS medzap CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE medzap;

-- ============================================
-- 1. Пользователи (пациенты и администраторы)
-- ============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    birth_date DATE DEFAULT NULL,
    role ENUM('patient', 'admin') DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================
-- 2. Специальности врачей
-- ============================================
CREATE TABLE specializations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT DEFAULT NULL,
    icon_url VARCHAR(255) DEFAULT NULL
) ENGINE=InnoDB;

-- ============================================
-- 3. Врачи
-- ============================================
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    specialization_id INT NOT NULL,
    experience_years INT DEFAULT 0,
    education TEXT DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    photo_url VARCHAR(255) DEFAULT NULL,
    cabinet VARCHAR(20) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================
-- 4. Расписание работы врачей
-- ============================================
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб, 7=Вс',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INT DEFAULT 30 COMMENT 'Длительность приёма в минутах',
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_schedule (doctor_id, day_of_week)
) ENGINE=InnoDB;

-- ============================================
-- 5. Записи на приём
-- ============================================
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
    reason TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL COMMENT 'Заметки врача после приёма',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    UNIQUE KEY unique_appointment (doctor_id, appointment_date, appointment_time)
) ENGINE=InnoDB;

-- ============================================
-- 6. Медицинские карты пациентов
-- ============================================
CREATE TABLE medical_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL UNIQUE,
    blood_type VARCHAR(10) DEFAULT NULL,
    allergies TEXT DEFAULT NULL,
    chronic_diseases TEXT DEFAULT NULL,
    insurance_number VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 7. Записи в медкарте (история посещений)
-- ============================================
CREATE TABLE medical_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medical_card_id INT NOT NULL,
    appointment_id INT DEFAULT NULL,
    doctor_id INT NOT NULL,
    diagnosis TEXT DEFAULT NULL,
    treatment TEXT DEFAULT NULL,
    prescriptions TEXT DEFAULT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (medical_card_id) REFERENCES medical_cards(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 8. Очередь пациентов (на текущий день)
-- ============================================
CREATE TABLE queue (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    queue_number INT NOT NULL,
    status ENUM('waiting', 'in_progress', 'done', 'skipped') DEFAULT 'waiting',
    called_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- 9. Напоминания
-- ============================================
CREATE TABLE reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL,
    remind_at DATETIME NOT NULL,
    method ENUM('email', 'sms') DEFAULT 'email',
    is_sent TINYINT(1) DEFAULT 0,
    sent_at TIMESTAMP NULL DEFAULT NULL,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Начальные данные: специальности
-- ============================================
INSERT INTO specializations (name, description, icon_url) VALUES
('Терапевт', 'Диагностика и лечение заболеваний внутренних органов', 'https://cdn-icons-png.flaticon.com/512/387/387561.png'),
('Хирург', 'Профессиональная хирургическая помощь и консультации', 'https://cdn-icons-png.flaticon.com/512/3209/3209265.png'),
('Педиатр', 'Уход и диагностика заболеваний у детей', 'https://cdn-icons-png.flaticon.com/512/4320/4320323.png'),
('Кардиолог', 'Забота о здоровье вашего сердца', 'https://cdn-icons-png.flaticon.com/512/1995/1995574.png'),
('Невролог', 'Диагностика и лечение заболеваний нервной системы', 'https://cdn-icons-png.flaticon.com/512/2785/2785482.png'),
('Офтальмолог', 'Проверка и лечение зрения', 'https://cdn-icons-png.flaticon.com/512/2326/2326443.png');

-- ============================================
-- Начальные данные: врачи
-- ============================================
INSERT INTO doctors (full_name, specialization_id, experience_years, education, cabinet, phone) VALUES
('Иванов Алексей Петрович', 1, 15, 'МГМУ им. Сеченова, 2008', '101', '+7 (495) 111-22-33'),
('Петрова Мария Сергеевна', 1, 8, 'РНИМУ им. Пирогова, 2015', '102', '+7 (495) 111-22-34'),
('Сидоров Дмитрий Иванович', 2, 20, 'МГМУ им. Сеченова, 2003', '201', '+7 (495) 111-22-35'),
('Козлова Анна Владимировна', 3, 12, 'СПбГМУ им. Павлова, 2011', '301', '+7 (495) 111-22-36'),
('Морозов Игорь Николаевич', 4, 18, 'МГМУ им. Сеченова, 2005', '401', '+7 (495) 111-22-37'),
('Волкова Елена Дмитриевна', 5, 10, 'РНИМУ им. Пирогова, 2013', '501', '+7 (495) 111-22-38'),
('Новиков Андрей Сергеевич', 6, 7, 'СПбГМУ им. Павлова, 2016', '601', '+7 (495) 111-22-39');

-- ============================================
-- Начальные данные: расписание врачей
-- ============================================
INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, slot_duration) VALUES
-- Иванов (Терапевт) — Пн-Пт
(1, 1, '08:00', '14:00', 30),
(1, 2, '08:00', '14:00', 30),
(1, 3, '08:00', '14:00', 30),
(1, 4, '08:00', '14:00', 30),
(1, 5, '08:00', '14:00', 30),
-- Петрова (Терапевт) — Пн-Пт (вторая смена)
(2, 1, '14:00', '20:00', 30),
(2, 2, '14:00', '20:00', 30),
(2, 3, '14:00', '20:00', 30),
(2, 4, '14:00', '20:00', 30),
(2, 5, '14:00', '20:00', 30),
-- Сидоров (Хирург) — Пн, Ср, Пт
(3, 1, '09:00', '15:00', 45),
(3, 3, '09:00', '15:00', 45),
(3, 5, '09:00', '15:00', 45),
-- Козлова (Педиатр) — Пн-Сб
(4, 1, '08:00', '13:00', 20),
(4, 2, '08:00', '13:00', 20),
(4, 3, '08:00', '13:00', 20),
(4, 4, '08:00', '13:00', 20),
(4, 5, '08:00', '13:00', 20),
(4, 6, '09:00', '12:00', 20),
-- Морозов (Кардиолог) — Вт, Чт
(5, 2, '10:00', '16:00', 40),
(5, 4, '10:00', '16:00', 40),
-- Волкова (Невролог) — Пн, Ср, Пт
(6, 1, '09:00', '15:00', 30),
(6, 3, '09:00', '15:00', 30),
(6, 5, '09:00', '15:00', 30),
-- Новиков (Офтальмолог) — Вт, Чт, Сб
(7, 2, '08:00', '14:00', 30),
(7, 4, '08:00', '14:00', 30),
(7, 6, '09:00', '13:00', 30);

-- ============================================
-- Начальные данные: администратор
-- ============================================
INSERT INTO users (username, email, password, full_name, role) VALUES
('admin', 'admin@medzap.ru', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Администратор', 'admin');
-- Пароль: password
