<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — получить записи
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'my';

    // Записи текущего пациента
    if ($action === 'my' && isset($_SESSION['user_id'])) {
        $stmt = $pdo->prepare("
            SELECT a.*, d.full_name AS doctor_name, s.name AS specialization_name, d.cabinet
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN specializations s ON d.specialization_id = s.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.appointment_time DESC
        ");
        $stmt->execute([$_SESSION['user_id']]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    // Все записи (для админа)
    if ($action === 'all' && isset($_SESSION['role']) && $_SESSION['role'] === 'admin') {
        $date = $_GET['date'] ?? date('Y-m-d');
        $stmt = $pdo->prepare("
            SELECT a.*, d.full_name AS doctor_name, s.name AS specialization_name,
                   u.full_name AS patient_name, u.phone AS patient_phone, d.cabinet
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN specializations s ON d.specialization_id = s.id
            JOIN users u ON a.patient_id = u.id
            WHERE a.appointment_date = ?
            ORDER BY a.appointment_time ASC
        ");
        $stmt->execute([$date]);
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
        exit;
    }

    // Доступные слоты для записи
    if ($action === 'slots') {
        $doctorId = $_GET['doctor_id'] ?? null;
        $date = $_GET['date'] ?? null;

        if (!$doctorId || !$date) {
            echo json_encode(['success' => false, 'error' => 'Не указан врач или дата']);
            exit;
        }

        $dayOfWeek = date('N', strtotime($date)); // 1=Пн .. 7=Вс

        // Получаем расписание врача на этот день
        $stmt = $pdo->prepare("SELECT * FROM schedules WHERE doctor_id = ? AND day_of_week = ? AND is_active = 1");
        $stmt->execute([$doctorId, $dayOfWeek]);
        $schedule = $stmt->fetch();

        if (!$schedule) {
            echo json_encode(['success' => true, 'data' => [], 'message' => 'Врач не принимает в этот день']);
            exit;
        }

        // Получаем занятые слоты
        $stmt = $pdo->prepare("SELECT appointment_time FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND status != 'cancelled'");
        $stmt->execute([$doctorId, $date]);
        $booked = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Генерируем свободные слоты
        $slots = [];
        $start = strtotime($schedule['start_time']);
        $end = strtotime($schedule['end_time']);
        $duration = $schedule['slot_duration'] * 60;

        while ($start + $duration <= $end) {
            $timeStr = date('H:i:s', $start);
            $timeShort = date('H:i', $start);
            $isBooked = in_array($timeStr, $booked);
            $slots[] = [
                'time' => $timeStr,
                'time_short' => $timeShort,
                'available' => !$isBooked
            ];
            $start += $duration;
        }

        echo json_encode(['success' => true, 'data' => $slots]);
        exit;
    }

    echo json_encode(['success' => false, 'error' => 'Неизвестное действие']);
    exit;
}

// POST — создать запись
if ($method === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Необходима авторизация']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);

    $doctorId = $data['doctor_id'] ?? null;
    $date = $data['date'] ?? null;
    $time = $data['time'] ?? null;
    $reason = $data['reason'] ?? null;

    if (!$doctorId || !$date || !$time) {
        echo json_encode(['success' => false, 'error' => 'Не все данные заполнены']);
        exit;
    }

    // Проверяем, не занят ли слот
    $stmt = $pdo->prepare("SELECT id FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'");
    $stmt->execute([$doctorId, $date, $time]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => false, 'error' => 'Этот слот уже занят']);
        exit;
    }

    // Проверяем, что дата в будущем
    if (strtotime($date) < strtotime('today')) {
        echo json_encode(['success' => false, 'error' => 'Нельзя записаться на прошедшую дату']);
        exit;
    }

    // Создаём запись
    $stmt = $pdo->prepare("INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, reason, status)
                           VALUES (?, ?, ?, ?, ?, 'confirmed')");
    $stmt->execute([$_SESSION['user_id'], $doctorId, $date, $time, $reason]);

    $appointmentId = $pdo->lastInsertId();

    // Создаём напоминание (за день до приёма)
    $remindAt = date('Y-m-d 10:00:00', strtotime($date . ' -1 day'));
    if (strtotime($remindAt) > time()) {
        $stmt = $pdo->prepare("INSERT INTO reminders (appointment_id, remind_at, method) VALUES (?, ?, 'email')");
        $stmt->execute([$appointmentId, $remindAt]);
    }

    echo json_encode(['success' => true, 'id' => $appointmentId, 'message' => 'Запись успешно создана!']);
    exit;
}

// PUT — обновить статус (отмена)
if ($method === 'PUT') {
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'error' => 'Необходима авторизация']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;

    if (!$id || !$status) {
        echo json_encode(['success' => false, 'error' => 'Не указан ID или статус']);
        exit;
    }

    // Пациент может только отменить свою запись
    if ($_SESSION['role'] === 'patient') {
        $stmt = $pdo->prepare("UPDATE appointments SET status = ? WHERE id = ? AND patient_id = ?");
        $stmt->execute([$status, $id, $_SESSION['user_id']]);
    } else {
        // Админ может менять любой статус
        $stmt = $pdo->prepare("UPDATE appointments SET status = ?, notes = ? WHERE id = ?");
        $stmt->execute([$status, $data['notes'] ?? null, $id]);
    }

    echo json_encode(['success' => true]);
    exit;
}
?>
