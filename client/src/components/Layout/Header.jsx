// src/components/Layout/Header.jsx
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../common/LanguageSwitcher.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import './Header.css';

function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand">
          TechMatch <span>Japan</span>
        </Link>

        <nav className="site-header__nav">
          <NavLink to="/dashboard" className="site-header__link">
            {t('nav.dashboard')}
          </NavLink>
          <NavLink to="/jobs" className="site-header__link">
            {t('nav.jobs')}
          </NavLink>
          <NavLink to="/analyzer" className="site-header__link">
            {t('nav.analyzer')}
          </NavLink>
        </nav>

        <div className="site-header__actions">
          {isAuthenticated ? (
            <div className="site-header__user">
              <span className="site-header__username">{user?.display_name || user?.email}</span>
              <button type="button" className="site-header__logout" onClick={logout}>
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="site-header__link">
                {t('nav.login')}
              </NavLink>
              <NavLink to="/register" className="site-header__link site-header__link--cta">
                {t('nav.register')}
              </NavLink>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

export default Header;
