// src/components/Analyzer/RecommendedSkills.jsx
import { useTranslation } from 'react-i18next';
import './RecommendedSkills.css';

function RecommendedSkills({ mostDemandedMissing, recommendedNext, onAddSkill }) {
  const { t } = useTranslation();
  const recommendedSet = new Set(recommendedNext);

  return (
    <div className="recommended-skills">
      <h3 className="recommended-skills__title">{t('analyzer.recommendedSkills')}</h3>
      <p className="recommended-skills__hint">{t('analyzer.addSuggested')}</p>

      <div className="recommended-skills__list">
        {mostDemandedMissing.map((skill) => (
          <button
            type="button"
            key={skill}
            className={`recommended-skill ${recommendedSet.has(skill) ? 'is-top' : ''}`}
            onClick={() => onAddSkill(skill)}
          >
            {skill}
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecommendedSkills;
