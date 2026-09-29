// src/pages/Register.jsx
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import RegisterForm from '../components/Auth/RegisterForm.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import './AuthPage.css';

function Register() {
  const { t } = useTranslation();
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <h1 className="auth-page__title">{t('auth.createAccount')}</h1>
      <RegisterForm />
    </div>
  );
}

export default Register;
