<?php
session_start();
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

    $stmt = $pdo->prepare("INSERT INTO doctors (full_name, specialization_id, experience_years, education, phone, cabinet)
                           VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['full_name'],
        $data['specialization_id'],
        $data['experience_years'] ?? 0,
        $data['education'] ?? null,
        $data['phone'] ?? null,
        $data['cabinet'] ?? null
    ]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    exit;
}
?>
