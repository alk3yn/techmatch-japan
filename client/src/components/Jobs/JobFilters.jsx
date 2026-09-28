// src/components/Jobs/JobFilters.jsx
// Controlled by local state; on submit it hands a plain params object to
// the parent, which writes it to the URL (so searches are shareable and
// can be saved later).
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getLang, formatYenShort } from '../../utils/jobs';
import './JobFilters.css';

const LOCATIONS = ['Tokyo', 'Remote', 'Osaka', 'Yokohama', 'Nagoya'];
const SALARY_STEPS = [3, 4, 5, 6, 7, 8, 9].map((m) => m * 1000000);
const EXPERIENCE_STEPS = [0, 1, 2, 3, 5];

function JobFilters({ initial, skillOptions, onApply, onReset }) {
  const { t, i18n } = useTranslation();
  const lang = getLang(i18n);

  const [location, setLocation] = useState(initial.location || '');
  const [salaryMin, setSalaryMin] = useState(initial.salary_min || '');
  const [salaryMax, setSalaryMax] = useState(initial.salary_max || '');
  const [experienceMax, setExperienceMax] = useState(initial.experience_max ?? '');
  const [remote, setRemote] = useState(initial.remote === 'true');
  const [careerChanger, setCareerChanger] = useState(initial.career_changer === 'true');
  const [skills, setSkills] = useState(initial.skills ? initial.skills.split(',') : []);

  function toggleSkill(skill) {
    setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
  }

  function handleSubmit(e) {
    e.preventDefault();
    let min = salaryMin;
    let max = salaryMax;
    if (min && max && Number(min) > Number(max)) {
      [min, max] = [max, min]; // forgive a swapped range
    }

    const params = {};
    if (location) params.location = location;
    if (min) params.salary_min = String(min);
    if (max) params.salary_max = String(max);
    if (experienceMax !== '') params.experience_max = String(experienceMax);
    if (remote) params.remote = 'true';
    if (careerChanger) params.career_changer = 'true';
    if (skills.length) params.skills = skills.join(',');
    onApply(params);
  }

  return (
    <form className="job-filters" onSubmit={handleSubmit}>
      <label className="job-filters__field">
        <span>{t('jobs.location')}</span>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option value="">{t('jobs.allLocations')}</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {t(`jobs.locations.${loc}`, loc)}
            </option>
          ))}
        </select>
      </label>

      <div className="job-filters__row">
        <label className="job-filters__field">
          <span>{t('jobs.salaryMin')}</span>
          <select value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)}>
            <option value="">{t('jobs.any')}</option>
            {SALARY_STEPS.map((v) => (
              <option key={v} value={v}>
                {formatYenShort(v, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="job-filters__field">
          <span>{t('jobs.salaryMax')}</span>
          <select value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)}>
            <option value="">{t('jobs.any')}</option>
            {SALARY_STEPS.map((v) => (
              <option key={v} value={v}>
                {formatYenShort(v, lang)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="job-filters__field">
        <span>{t('jobs.experience')}</span>
        <select value={experienceMax} onChange={(e) => setExperienceMax(e.target.value)}>
          <option value="">{t('jobs.any')}</option>
          {EXPERIENCE_STEPS.map((v) => (
            <option key={v} value={v}>
              {v === 0 ? t('jobs.experienceNone') : t('jobs.experienceUpTo', { years: v })}
            </option>
          ))}
        </select>
      </label>

      <label className="job-filters__check">
        <input type="checkbox" checked={remote} onChange={(e) => setRemote(e.target.checked)} />
        <span>{t('jobs.remote')}</span>
      </label>
      <label className="job-filters__check">
        <input
          type="checkbox"
          checked={careerChanger}
          onChange={(e) => setCareerChanger(e.target.checked)}
        />
        <span>{t('jobs.careerChanger')}</span>
      </label>

      <div className="job-filters__field">
        <span>{t('jobs.skills')}</span>
        <div className="job-filters__skills">
          {skillOptions.map((skill) => (
            <button
              type="button"
              key={skill}
              className={`job-filters__skill ${skills.includes(skill) ? 'is-active' : ''}`}
              aria-pressed={skills.includes(skill)}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div className="job-filters__actions">
        <button type="submit" className="job-filters__submit">
          {t('jobs.search')}
        </button>
        <button type="button" className="job-filters__reset" onClick={onReset}>
          {t('jobs.reset')}
        </button>
      </div>
    </form>
  );
}

export default JobFilters;
