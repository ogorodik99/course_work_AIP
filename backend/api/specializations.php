<?php
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

$stmt = $pdo->query("SELECT * FROM specializations ORDER BY name");
$data = $stmt->fetchAll();

echo json_encode(['success' => true, 'data' => $data]);
?>
