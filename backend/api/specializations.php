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

$stmt = $pdo->query("SELECT * FROM specializations ORDER BY name");
$data = $stmt->fetchAll();

echo json_encode(['success' => true, 'data' => $data]);
?>
