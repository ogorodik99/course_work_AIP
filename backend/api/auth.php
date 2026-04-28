<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
include '../db.php';

$method = $_SERVER['REQUEST_METHOD'];

// GET — проверка сессии
if ($method === 'GET') {
    $action = $_GET['action'] ?? 'check';

    if ($action === 'check') {
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
        exit;
    }

    // Выход
    if ($action === 'logout') {
        session_destroy();
        echo json_encode(['success' => true]);
        exit;
    }
}

// POST — вход / регистрация
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';

    // ─── Вход ───────────────────────────────────────────────
    if ($action === 'login') {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Заполните все поля']);
            exit;
        }

        // Ищем по email или username
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['full_name'] = $user['full_name'] ?? $user['username'];
            $_SESSION['role'] = $user['role'];

            echo json_encode([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'full_name' => $user['full_name'] ?? $user['username'],
                    'email' => $user['email'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['success' => false, 'error' => 'Неверный email или пароль']);
        }
        exit;
    }

    // ─── Регистрация ────────────────────────────────────────
    if ($action === 'register') {
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Заполните все поля']);
            exit;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Пароль должен быть не менее 6 символов']);
            exit;
        }

        // Проверка уникальности
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $name]);
        if ($stmt->rowCount() > 0) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Пользователь с таким email уже существует']);
            exit;
        }

        $passwordHash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, 'patient')");
        $stmt->execute([$name, $email, $passwordHash, $name]);

        $userId = $pdo->lastInsertId();

        // Создаём медкарту
        $stmt = $pdo->prepare("INSERT INTO medical_cards (patient_id) VALUES (?)");
        $stmt->execute([$userId]);

        // Автоматический вход
        $_SESSION['user_id'] = $userId;
        $_SESSION['username'] = $name;
        $_SESSION['full_name'] = $name;
        $_SESSION['role'] = 'patient';

        echo json_encode([
            'success' => true,
            'user' => [
                'id' => $userId,
                'username' => $name,
                'full_name' => $name,
                'email' => $email,
                'role' => 'patient'
            ]
        ]);
        exit;
    }
}

http_response_code(400);
echo json_encode(['success' => false, 'error' => 'Неизвестное действие']);
?>
