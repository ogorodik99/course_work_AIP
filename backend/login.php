<?php
session_start();
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST['username']);
    $password = $_POST['password'];

    if (empty($username) || empty($password)) {
        $_SESSION['error'] = "Заполните все поля!";
        header("Location: ../public/appointment.html");
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['full_name'] = $user['full_name'] ?? $user['username'];
        $_SESSION['role'] = $user['role'];

        if ($user['role'] === 'admin') {
            header("Location: ../public/admin.html");
        } else {
            header("Location: ../public/cabinet.html");
        }
        exit;
    } else {
        $_SESSION['error'] = "Неверный логин или пароль!";
        header("Location: ../public/appointment.html");
        exit;
    }
}
?>
