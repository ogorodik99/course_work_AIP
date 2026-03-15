<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $password_confirm = $_POST['password_confirm'];

    // Валидация
    if (empty($username) || empty($email) || empty($password)) {
        $_SESSION['error'] = "Заполните все обязательные поля!";
        header("Location: ../public/appointment.html");
        exit;
    }

    if ($password !== $password_confirm) {
        $_SESSION['error'] = "Пароли не совпадают!";
        header("Location: ../public/appointment.html");
        exit;
    }

    if (strlen($password) < 6) {
        $_SESSION['error'] = "Пароль должен быть не менее 6 символов!";
        header("Location: ../public/appointment.html");
        exit;
    }

    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->rowCount() > 0) {
        $_SESSION['error'] = "Пользователь с таким именем или email уже существует!";
        header("Location: ../public/appointment.html");
        exit;
    }

    // Хешируем пароль и вставляем
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'patient')");
    $stmt->execute([$username, $email, $passwordHash]);

    $userId = $pdo->lastInsertId();

    // Создаём медкарту автоматически
    $stmt = $pdo->prepare("INSERT INTO medical_cards (patient_id) VALUES (?)");
    $stmt->execute([$userId]);

    // Автоматически входим
    $_SESSION['user_id'] = $userId;
    $_SESSION['username'] = $username;
    $_SESSION['full_name'] = $username;
    $_SESSION['role'] = 'patient';

    header("Location: ../public/cabinet.html");
    exit;
}
?>
