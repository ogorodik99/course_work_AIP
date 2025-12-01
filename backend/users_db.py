# backend/users_db.py

users = {}

def add_user(username, password, email):
    users[username] = {'password': password, 'email': email}

def check_user(username, password):
    return username in users and users[username]['password'] == password

def user_exists(username):
    return username in users
