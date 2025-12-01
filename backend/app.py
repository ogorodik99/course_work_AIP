# backend/app.py
from flask import Flask, render_template

from auth import auth_bp

app = Flask(
    __name__,
    template_folder='../public',  # папка с HTML
    static_folder='../public'     # папка с CSS, JS, img
)

app.secret_key = 'secret123'

# Роут для главной страницы
@app.route('/')
def index():
    return render_template('index.html')

# Подключаем Blueprint
app.register_blueprint(auth_bp)

if __name__ == '__main__':
    app.run(debug=True)
