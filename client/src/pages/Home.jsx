// src/pages/Home.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './Home.css';

const FEATURE_KEYS = ['salary', 'skills', 'bilingual', 'career'];

const FEATURE_ICONS = {
  salary: '📊',
  skills: '🧩',
  bilingual: '🌐',
  career: '🚀',
};

function Home() {
  const { t } = useTranslation();

  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-hero__title">{t('home.title')}</h1>
        <p className="home-hero__subtitle">{t('home.subtitle')}</p>
        <p className="home-hero__description">{t('home.description')}</p>
        <Link to="/dashboard" className="home-hero__cta">
          {t('home.cta')}
        </Link>
      </section>

      <section className="home-features">
        {FEATURE_KEYS.map((key) => (
          <div className="home-feature-card" key={key}>
            <div className="home-feature-card__icon" aria-hidden="true">
              {FEATURE_ICONS[key]}
            </div>
            <h3 className="home-feature-card__title">{t(`home.features.${key}.title`)}</h3>
            <p className="home-feature-card__description">
              {t(`home.features.${key}.description`)}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Home;
