import React from 'react'

function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <h3 className="footer-title">О платформе</h3>
          <p className="footer-text">
            МедЗапись — современная система для записи к врачам. Быстро, удобно и безопасно.
          </p>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Навигация</h3>
          <ul className="footer-links">
            <li><a href="/" className="footer-link">Главная</a></li>
            <li><a href="/" className="footer-link">Преимущества</a></li>
            <li><a href="/" className="footer-link">Специалисты</a></li>
            <li><a href="/booking" className="footer-link">Запись на прием</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">Контакты</h3>
          <div className="footer-contact">
            <p className="footer-text">Телефон: +7 (999) 123-45-67</p>
            <p className="footer-text">Email: info@medzapis.ru</p>
            <p className="footer-text">Адрес: г. Москва, ул. Медицинская, 10</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          &copy; {currentYear} МедЗапись. Все права защищены.
        </p>
      </div>
    </footer>
  )
}

export default Footer
