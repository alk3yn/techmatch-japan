// src/components/common/Loading.jsx
import { useTranslation } from 'react-i18next';
import './Loading.css';

function Loading({ label }) {
  const { t } = useTranslation();
  return (
    <div className="loading" role="status">
      <span className="loading__spinner" aria-hidden="true" />
      <span>{label || t('common.loading')}</span>
    </div>
  );
}

export default Loading;
