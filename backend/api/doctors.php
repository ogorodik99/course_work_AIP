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

// GET — список врачей (с фильтрацией по специальности)
if ($method === 'GET') {
    $specId = $_GET['specialization_id'] ?? null;

    $sql = "SELECT d.*, s.name AS specialization_name, s.icon_url
            FROM doctors d
            JOIN specializations s ON d.specialization_id = s.id
            WHERE d.is_active = 1";
    $params = [];

    if ($specId) {
        $sql .= " AND d.specialization_id = ?";
        $params[] = $specId;
    }

    $sql .= " ORDER BY s.name, d.full_name";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $doctors = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $doctors]);
    exit;
}

// POST — добавить врача (только admin)
if ($method === 'POST') {
    if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
        echo json_encode(['success' => false, 'error' => 'Доступ запрещён']);
        exit;
    }

    $data = json_decode(file_get_contents('php://input'), true);
    $fullName = trim($data['full_name'] ?? $data['name'] ?? '');
    $specializationId = $data['specialization_id'] ?? $data['specializationId'] ?? null;
    $experienceYears = $data['experience_years'] ?? $data['experience'] ?? 0;

    if ($fullName === '' || !$specializationId) {
        echo json_encode(['success' => false, 'error' => 'Укажите ФИО и специальность врача']);
        exit;
    }

    $stmt = $pdo->prepare("INSERT INTO doctors (full_name, specialization_id, experience_years, education, phone, cabinet)
                           VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $fullName,
        $specializationId,
        $experienceYears,
        $data['education'] ?? null,
        $data['phone'] ?? null,
        $data['cabinet'] ?? null
    ]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}
?>
