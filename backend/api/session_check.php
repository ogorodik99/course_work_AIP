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

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['authorized' => false]);
    exit;
}

echo json_encode([
    'authorized' => true,
    'user_id' => $_SESSION['user_id'],
    'username' => $_SESSION['username'],
    'full_name' => $_SESSION['full_name'],
    'role' => $_SESSION['role']
]);
?>
