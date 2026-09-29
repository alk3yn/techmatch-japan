// src/components/Analyzer/SkillInput.jsx
// Free-text entry (Enter or the Add button) plus filtered suggestion chips
// from the known skill pool, so a skill not in the pool can still be typed.

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SkillInput.css';

const MAX_SUGGESTIONS = 8;

function SkillInput({ skills, skillOptions, onChange }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const suggestions = useMemo(() => {
    const query = text.trim().toLowerCase();
    const already = new Set(skills.map((s) => s.toLowerCase()));
    const pool = skillOptions.filter((s) => !already.has(s.toLowerCase()));
    const filtered = query ? pool.filter((s) => s.toLowerCase().includes(query)) : pool;
    return filtered.slice(0, MAX_SUGGESTIONS);
  }, [text, skills, skillOptions]);

  function addSkill(raw) {
    const value = raw.trim();
    if (!value) return;
    const already = skills.some((s) => s.toLowerCase() === value.toLowerCase());
    if (!already) onChange([...skills, value]);
    setText('');
  }

  function removeSkill(skill) {
    onChange(skills.filter((s) => s !== skill));
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill(text);
    }
  }

  return (
    <div className="skill-input">
      <div className="skill-input__row">
        <input
          type="text"
          className="skill-input__field"
          placeholder={t('analyzer.placeholder')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button type="button" className="skill-input__add" onClick={() => addSkill(text)}>
          {t('analyzer.addSkill')}
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="skill-input__suggestions">
          <span className="skill-input__suggestions-label">{t('analyzer.popularSkills')}</span>
          <div className="skill-input__suggestion-list">
            {suggestions.map((skill) => (
              <button
                type="button"
                key={skill}
                className="skill-input__suggestion"
                onClick={() => addSkill(skill)}
              >
                + {skill}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="skill-input__tags">
        {skills.map((skill) => (
          <span className="skill-tag" key={skill}>
            {skill}
            <button
              type="button"
              className="skill-tag__remove"
              aria-label={`${t('analyzer.remove')} ${skill}`}
              onClick={() => removeSkill(skill)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default SkillInput;
