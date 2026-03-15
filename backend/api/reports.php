<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
    exit;
}

$action = $_GET['action'] ?? 'summary';

// Общая статистика
if ($action === 'summary') {
    // Всего пациентов
    $totalPatients = $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'patient'")->fetchColumn();

    // Всего записей
    $totalAppointments = $pdo->query("SELECT COUNT(*) FROM appointments")->fetchColumn();

    // Записей сегодня
    $today = date('Y-m-d');
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE appointment_date = ?");
    $stmt->execute([$today]);
    $todayAppointments = $stmt->fetchColumn();

    // Завершено приёмов
    $completedAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'completed'")->fetchColumn();

    // Отменено
    $cancelledAppointments = $pdo->query("SELECT COUNT(*) FROM appointments WHERE status = 'cancelled'")->fetchColumn();

    echo json_encode([
        'success' => true,
        'data' => [
            'total_patients' => (int)$totalPatients,
            'total_appointments' => (int)$totalAppointments,
            'today_appointments' => (int)$todayAppointments,
            'completed_appointments' => (int)$completedAppointments,
            'cancelled_appointments' => (int)$cancelledAppointments
        ]
    ]);
    exit;
}

// Статистика по врачам
if ($action === 'doctors') {
    $dateFrom = $_GET['date_from'] ?? date('Y-m-01');
    $dateTo = $_GET['date_to'] ?? date('Y-m-d');

    $stmt = $pdo->prepare("
        SELECT d.full_name, sp.name AS specialization,
               COUNT(a.id) AS total_appointments,
               SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
               SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
        FROM doctors d
        JOIN specializations sp ON d.specialization_id = sp.id
        LEFT JOIN appointments a ON d.id = a.doctor_id
            AND a.appointment_date BETWEEN ? AND ?
        GROUP BY d.id
        ORDER BY total_appointments DESC
    ");
    $stmt->execute([$dateFrom, $dateTo]);

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// Статистика по дням (для графика)
if ($action === 'daily') {
    $days = $_GET['days'] ?? 30;
    $stmt = $pdo->prepare("
        SELECT appointment_date AS date, COUNT(*) AS count
        FROM appointments
        WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        GROUP BY appointment_date
        ORDER BY appointment_date
    ");
    $stmt->execute([$days]);

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}

// Статистика по специальностям
if ($action === 'specializations') {
    $stmt = $pdo->query("
        SELECT sp.name, COUNT(a.id) AS count
        FROM specializations sp
        JOIN doctors d ON sp.id = d.specialization_id
        LEFT JOIN appointments a ON d.id = a.doctor_id
        GROUP BY sp.id
        ORDER BY count DESC
    ");

    echo json_encode(['success' => true, 'data' => $stmt->fetchAll()]);
    exit;
}
?>
