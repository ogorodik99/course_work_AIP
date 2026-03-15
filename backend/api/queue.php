<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — получить очередь на сегодня
if ($method === 'GET') {
    $today = date('Y-m-d');
    $doctorId = $_GET['doctor_id'] ?? null;

    $sql = "
        SELECT q.*, a.appointment_time, a.appointment_date,
               d.full_name AS doctor_name, d.cabinet,
               u.full_name AS patient_name, sp.name AS specialization_name
        FROM queue q
        JOIN appointments a ON q.appointment_id = a.id
        JOIN doctors d ON a.doctor_id = d.id
        JOIN specializations sp ON d.specialization_id = sp.id
        JOIN users u ON a.patient_id = u.id
        WHERE a.appointment_date = ?
    ";
    $params = [$today];

    if ($doctorId) {
        $sql .= " AND a.doctor_id = ?";
        $params[] = $doctorId;
    }

    $sql .= " ORDER BY q.queue_number ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// POST — сформировать очередь на сегодня (admin)
if ($method === 'POST') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
        exit;
    }

    $today = date('Y-m-d');

    // Получаем все подтверждённые записи на сегодня, которых ещё нет в очереди
    $stmt = $pdo->prepare("
        SELECT a.id FROM appointments a
        LEFT JOIN queue q ON a.id = q.appointment_id
        WHERE a.appointment_date = ? AND a.status IN ('confirmed', 'pending') AND q.id IS NULL
        ORDER BY a.appointment_time ASC
    ");
    $stmt->execute([$today]);
    $appointments = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // Определяем последний номер в очереди
    $stmt = $pdo->prepare("
        SELECT MAX(q.queue_number) FROM queue q
        JOIN appointments a ON q.appointment_id = a.id
        WHERE a.appointment_date = ?
    ");
    $stmt->execute([$today]);
    $lastNumber = $stmt->fetchColumn() ?: 0;

    $added = 0;
    foreach ($appointments as $appId) {
        $lastNumber++;
        $stmt = $pdo->prepare("INSERT INTO queue (appointment_id, queue_number) VALUES (?, ?)");
        $stmt->execute([$appId, $lastNumber]);
        $added++;
    }

    echo json_encode(['success' => true, 'added' => $added]);
    exit;
}

// PUT — обновить статус в очереди (admin)
if ($method === 'PUT') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $id = $data['id'] ?? null;
    $status = $data['status'] ?? null;

    if (!$id || !$status) {
        echo json_encode(['success' => false, 'error' => 'Не указаны ID или статус']);
        exit;
    }

    $now = date('Y-m-d H:i:s');

    if ($status === 'in_progress') {
        $stmt = $pdo->prepare("UPDATE queue SET status = ?, called_at = ? WHERE id = ?");
        $stmt->execute([$status, $now, $id]);
    } elseif ($status === 'done') {
        $stmt = $pdo->prepare("UPDATE queue SET status = ?, completed_at = ? WHERE id = ?");
        $stmt->execute([$status, $now, $id]);

        // Обновляем статус записи
        $stmt = $pdo->prepare("
            UPDATE appointments SET status = 'completed'
            WHERE id = (SELECT appointment_id FROM queue WHERE id = ?)
        ");
        $stmt->execute([$id]);
    } else {
        $stmt = $pdo->prepare("UPDATE queue SET status = ? WHERE id = ?");
        $stmt->execute([$status, $id]);
    }

    echo json_encode(['success' => true]);
    exit;
}
?>
