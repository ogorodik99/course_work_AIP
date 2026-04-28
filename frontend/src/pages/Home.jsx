import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const fadeInElements = useRef([]);

  useEffect(() => {
    // Setup IntersectionObserver for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    // Observe all fade-in-up elements
    fadeInElements.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      fadeInElements.current.forEach((element) => {
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, []);

  const handleScrollToAdvantages = () => {
    const element = document.getElementById('advantages');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="badge">
              <span className="badge-icon">✓</span>
              Современная медицина
            </div>

            <h1 className="hero-title">
              Запишитесь к врачу онлайн — быстро и удобно
            </h1>

            <p className="hero-subtitle">
              МедЗапись — удобный сервис онлайн-записи на приём к врачу. Запишитесь к проверенным специалистам за несколько минут, без очередей и звонков.
            </p>

            <div className="hero-buttons">
              <Link to="/booking" className="btn btn-primary">
                Записаться сейчас
              </Link>
              <button
                className="btn btn-secondary"
                onClick={handleScrollToAdvantages}
              >
                Узнать больше
              </button>
            </div>

            {/* Stats Row */}
            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-number">500+</div>
                <div className="stat-label">Пациентов</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">50+</div>
                <div className="stat-label">Специалистов</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">98%</div>
                <div className="stat-label">Довольных</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages Section */}
      <section id="advantages" className="section advantages-section">
        <div className="container">
          <h2 className="section-title">Почему выбирают нас</h2>

          <div className="advantages-grid">
            {/* Card 1 */}
            <div
              className="advantage-card fade-in-up"
              ref={(el) => (fadeInElements.current[0] = el)}
            >
              <div className="card-icon">
                <i className="bi bi-lightning-charge"></i>
              </div>
              <h3>Быстрая запись</h3>
              <p>
                Запишитесь на приём за 2 минуты. Никаких сложных форм и долгих звонков в клинику.
              </p>
            </div>

            {/* Card 2 */}
            <div
              className="advantage-card fade-in-up"
              ref={(el) => (fadeInElements.current[1] = el)}
            >
              <div className="card-icon">
                <i className="bi bi-people"></i>
              </div>
              <h3>Электронная очередь</h3>
              <p>
                Никаких очередей в клинике. Приходите ровно к назначенному времени и начните консультацию.
              </p>
            </div>

            {/* Card 3 */}
            <div
              className="advantage-card fade-in-up"
              ref={(el) => (fadeInElements.current[2] = el)}
            >
              <div className="card-icon">
                <i className="bi bi-person-badge"></i>
              </div>
              <h3>Личный кабинет</h3>
              <p>
                Вся история визитов, рецепты и результаты анализов в одном месте. Удобно и безопасно.
              </p>
            </div>

            {/* Card 4 */}
            <div
              className="advantage-card fade-in-up"
              ref={(el) => (fadeInElements.current[3] = el)}
            >
              <div className="card-icon">
                <i className="bi bi-bell"></i>
              </div>
              <h3>Напоминания</h3>
              <p>
                Получайте уведомления о предстоящем приёме. Никогда не забудете о встречу с врачом.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specialists Section */}
      <section id="specialists" className="section specialists-section">
        <div className="container">
          <h2 className="section-title">Наши специалисты</h2>

          <div className="specialists-grid">
            {/* Терапевт */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[4] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-heart-pulse"></i>
              </div>
              <h3>Терапевт</h3>
              <p>
                Первичная диагностика и лечение заболеваний внутренних органов. Профилактические осмотры и консультации.
              </p>
            </div>

            {/* Кардиолог */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[5] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-activity"></i>
              </div>
              <h3>Кардиолог</h3>
              <p>
                Диагностика и лечение заболеваний сердца и сосудов. ЭКГ и консультации по профилактике.
              </p>
            </div>

            {/* Невролог */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[6] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-brain"></i>
              </div>
              <h3>Невролог</h3>
              <p>
                Лечение заболеваний нервной системы. Консультации при головных болях и неврологических синдромах.
              </p>
            </div>

            {/* Хирург */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[7] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-scissors"></i>
              </div>
              <h3>Хирург</h3>
              <p>
                Хирургическое лечение и операции. Первичная консультация и подготовка к операциям.
              </p>
            </div>

            {/* Офтальмолог */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[8] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-eye"></i>
              </div>
              <h3>Офтальмолог</h3>
              <p>
                Диагностика и лечение заболеваний глаз. Подбор очков и контактных линз.
              </p>
            </div>

            {/* Дерматолог */}
            <div
              className="specialist-card fade-in-up"
              ref={(el) => (fadeInElements.current[9] = el)}
            >
              <div className="specialist-icon">
                <i className="bi bi-bandaid"></i>
              </div>
              <h3>Дерматолог</h3>
              <p>
                Лечение кожных заболеваний и косметология. Консультации по уходу за кожей.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="section steps-section">
        <div className="container">
          <h2 className="section-title">Как записаться на приём</h2>

          <div className="steps-grid">
            {/* Step 1 */}
            <div
              className="step-card fade-in-up"
              ref={(el) => (fadeInElements.current[10] = el)}
            >
              <div className="step-number">1</div>
              <h3>Выберите специальность</h3>
              <p>Найдите нужного специалиста из списка доступных врачей</p>
            </div>

            {/* Step 2 */}
            <div
              className="step-card fade-in-up"
              ref={(el) => (fadeInElements.current[11] = el)}
            >
              <div className="step-number">2</div>
              <h3>Выберите врача</h3>
              <p>Ознакомьтесь с опытом врача и выберите подходящего специалиста</p>
            </div>

            {/* Step 3 */}
            <div
              className="step-card fade-in-up"
              ref={(el) => (fadeInElements.current[12] = el)}
            >
              <div className="step-number">3</div>
              <h3>Выберите дату и время</h3>
              <p>Выберите удобное для вас время на интерактивном календаре</p>
            </div>

            {/* Step 4 */}
            <div
              className="step-card fade-in-up"
              ref={(el) => (fadeInElements.current[13] = el)}
            >
              <div className="step-number">4</div>
              <h3>Подтвердите запись</h3>
              <p>Укажите контактные данные и подтвердите запись на приём</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Запишитесь на приём прямо сейчас</h2>
            <p>
              Более 500 пациентов уже записались на приём через МедЗапись. Присоединяйтесь к ним!
            </p>
            <Link to="/booking" className="btn btn-primary btn-large">
              Записаться сейчас
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
