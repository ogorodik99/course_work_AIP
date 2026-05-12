<?php
session_start();

// CORS
$allowed = ['http://localhost:5173', 'http://localhost:3000'];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

$method = $_SERVER['REQUEST_METHOD'];
$dayNames = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// GET — получить расписание
if ($method === 'GET') {
    $doctorId = $_GET['doctor_id'] ?? null;

    if ($doctorId) {
        $stmt = $pdo->prepare("
            SELECT s.*, d.full_name AS doctor_name
            FROM schedules s
            JOIN doctors d ON s.doctor_id = d.id
            WHERE s.doctor_id = ? AND s.is_active = 1
            ORDER BY s.day_of_week
        ");
        $stmt->execute([$doctorId]);
    } else {
        $stmt = $pdo->query("
            SELECT s.*, d.full_name AS doctor_name, sp.name AS specialization_name
            FROM schedules s
            JOIN doctors d ON s.doctor_id = d.id
            JOIN specializations sp ON d.specialization_id = sp.id
            WHERE s.is_active = 1
            ORDER BY d.full_name, s.day_of_week
        ");
    }

    $data = $stmt->fetchAll();
    foreach ($data as &$row) {
        $row['day_name'] = $dayNames[$row['day_of_week']] ?? '';
    }

    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

// POST — добавить/обновить расписание (только admin)
if ($method === 'POST') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $doctorId = $data['doctor_id'] ?? $data['doctorId'] ?? null;
    $dayOfWeek = $data['day_of_week'] ?? $data['dayOfWeek'] ?? null;
    $startTime = $data['start_time'] ?? $data['startTime'] ?? null;
    $endTime = $data['end_time'] ?? $data['endTime'] ?? null;
    $slotDuration = (int)($data['slot_duration'] ?? $data['duration'] ?? 30);

    if (!$doctorId || !$dayOfWeek || !$startTime || !$endTime) {
        echo json_encode(['success' => false, 'error' => 'Заполните врача, день недели и время приема']);
        exit;
    }

    if (strtotime($startTime) === false || strtotime($endTime) === false || strtotime($startTime) >= strtotime($endTime)) {
        echo json_encode(['success' => false, 'error' => 'Некорректный временной интервал']);
        exit;
    }

    if ($slotDuration < 10 || $slotDuration > 120) {
        echo json_encode(['success' => false, 'error' => 'Длительность приема должна быть от 10 до 120 минут']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, slot_duration, is_active)
        VALUES (?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE start_time = VALUES(start_time), end_time = VALUES(end_time),
                                slot_duration = VALUES(slot_duration), is_active = 1
    ");
    $stmt->execute([
        $doctorId,
        $dayOfWeek,
        $startTime,
        $endTime,
        $slotDuration
    ]);

    echo json_encode(['success' => true]);
    exit;
}

// DELETE — удалить из расписания (только admin)
if ($method === 'DELETE') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;

    if ($id) {
        $stmt = $pdo->prepare("UPDATE schedules SET is_active = 0 WHERE id = ?");
        $stmt->execute([$id]);
    }

    echo json_encode(['success' => true]);
    exit;
}
?>
