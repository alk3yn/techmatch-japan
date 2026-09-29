// src/pages/Login.jsx
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoginForm from '../components/Auth/LoginForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import './AuthPage.css';

function Login() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">{t('auth.welcomeBack')}</h1>
      <LoginForm />
    </div>
  );
}

export default Login;
