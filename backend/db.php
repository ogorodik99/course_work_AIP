<?php
$db   = 'medzap';
$user = 'root';
$pass = '';
$charset = 'utf8mb4';

$dsn = "mysql:unix_socket=/tmp/mysql.sock;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['success' => false, 'error' => 'БД ошибка: ' . $e->getMessage()]));
}
?>