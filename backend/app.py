from flask import Flask, render_template, request, redirect, url_for, flash

app = Flask(__name__)
app.secret_key = 'secret123'

# Простое хранение пользователей
users = {}

@app.route('/')
def home():
    return 'Главная страница'

@app.route('/appointment', methods=['GET'])
def appointment():
    return render_template('appointment.html')

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    if username in users and users[username] == password:
        return f'Добро пожаловать, {username}!'
    else:
        flash('Неверный логин или пароль')
        return redirect(url_for('appointment'))

@app.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    password_confirm = request.form['password_confirm']

    if password != password_confirm:
        flash('Пароли не совпадают')
        return redirect(url_for('appointment'))

    if username in users:
        flash('Пользователь уже существует')
        return redirect(url_for('appointment'))

    users[username] = password
    flash('Регистрация прошла успешно!')
    return redirect(url_for('appointment'))

if __name__ == '__main__':
    app.run(debug=True)
