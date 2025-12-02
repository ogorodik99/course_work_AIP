<?php
include 'db.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $password_confirm = $_POST['password_confirm'];

    if ($password !== $password_confirm) {
        die("Пароли не совпадают!");
    }

    // Проверка существования пользователя
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->rowCount() > 0) {
        die("Пользователь уже существует!");
    }

    // Хешируем пароль
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    // Вставка в базу
    $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->execute([$username, $email, $passwordHash]);

    echo "Регистрация прошла успешно!";
}
?>
