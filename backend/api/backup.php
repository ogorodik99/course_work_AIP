<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
    exit;
}

$tables = [
    'patients' => "SELECT id, username, email, full_name, phone, birth_date, created_at FROM users WHERE role = 'patient'",
    'medical_cards' => "SELECT * FROM medical_cards",
    'medical_records' => "SELECT * FROM medical_records",
    'appointments' => "SELECT * FROM appointments",
    'reminders' => "SELECT * FROM reminders",
];

$backup = [
    'success' => true,
    'created_at' => date('c'),
    'format' => 'medzap-json-backup-v1',
    'tables' => [],
];

foreach ($tables as $name => $sql) {
    $stmt = $pdo->query($sql);
    $backup['tables'][$name] = $stmt->fetchAll();
}

header('Content-Disposition: attachment; filename="medzap-backup-' . date('Y-m-d-H-i') . '.json"');
echo json_encode($backup, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
