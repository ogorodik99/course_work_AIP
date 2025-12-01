# backend/auth.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from users_db import add_user, check_user, user_exists

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/appointment')
def appointment():
    return render_template('appointment.html')

@auth_bp.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    if check_user(username, password):
        return f'Добро пожаловать, {username}!'
    else:
        flash('Неверный логин или пароль')
        return redirect(url_for('auth.appointment'))

@auth_bp.route('/register', methods=['POST'])
def register():
    username = request.form['username']
    email = request.form['email']
    password = request.form['password']
    password_confirm = request.form['password_confirm']

    if password != password_confirm:
        flash('Пароли не совпадают')
        return redirect(url_for('auth.appointment'))

    if user_exists(username):
        flash('Пользователь уже существует')
        return redirect(url_for('auth.appointment'))

    add_user(username, password, email)
    flash('Регистрация прошла успешно!')
    return redirect(url_for('auth.appointment'))
