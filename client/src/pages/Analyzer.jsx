// src/pages/Analyzer.jsx
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext.jsx';
import SkillInput from '../components/Analyzer/SkillInput.jsx';
import MatchResult from '../components/Analyzer/MatchResult.jsx';
import RecommendedSkills from '../components/Analyzer/RecommendedSkills.jsx';
import Loading from '../components/common/Loading.jsx';
import './Analyzer.css';

function Analyzer() {
  const { t } = useTranslation();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const [skills, setSkills] = useState([]);
  const [skillOptions, setSkillOptions] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hydratedRef = useRef(false);

  useEffect(() => {
    apiClient
      .get('/jobs/skills')
      .then((res) => setSkillOptions(res.data.data.skills))
      .catch(() => setSkillOptions([]));
  }, []);

  // Once auth resolves, load the signed-in user's saved skills (if any) as
  // the starting point. Runs once per login state, not on every render.
  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated && user?.skills?.length) {
      setSkills(user.skills);
    }
    hydratedRef.current = true;
  }, [authLoading, isAuthenticated, user]);

  // Persist skill changes back to the profile for signed-in users.
  useEffect(() => {
    if (!hydratedRef.current || !isAuthenticated) return;
    const timer = setTimeout(() => {
      apiClient.put('/user/profile', { skills }).catch(() => {
        // Non-critical — the analysis still works locally either way.
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [skills, isAuthenticated]);

  useEffect(() => {
    if (skills.length === 0) {
      setResult(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Small debounce so rapid add/remove clicks don't fire a request each.
    const timer = setTimeout(() => {
      apiClient
        .post('/analyzer', { skills })
        .then((res) => {
          if (!cancelled) setResult(res.data.data);
        })
        .catch((err) => {
          if (!cancelled) setError(err);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [skills]);

  function addSkill(skill) {
    setSkills((prev) => (prev.some((s) => s.toLowerCase() === skill.toLowerCase()) ? prev : [...prev, skill]));
  }

  return (
    <div className="analyzer-page">
      <h1 className="analyzer-page__title">{t('analyzer.title')}</h1>

      <div className="analyzer-layout">
        <aside className="analyzer-layout__input">
          <h2 className="analyzer-layout__label">{t('analyzer.yourSkills')}</h2>
          <SkillInput skills={skills} skillOptions={skillOptions} onChange={setSkills} />
          <p className="analyzer-page__persist-hint">
            {isAuthenticated ? t('analyzer.skillsSavedHint') : t('analyzer.loginToPersist')}
          </p>

          {result && (
            <RecommendedSkills
              mostDemandedMissing={result.overall_stats.most_demanded_missing}
              recommendedNext={result.overall_stats.recommended_next}
              onAddSkill={addSkill}
            />
          )}
        </aside>

        <section className="analyzer-layout__results">
          {skills.length === 0 && (
            <div className="analyzer-page__prompt">{t('analyzer.enterSkills')}</div>
          )}
          {loading && <Loading label={t('analyzer.analyzing')} />}
          {!loading && error && <div className="analyzer-page__error">{t('common.error')}</div>}
          {!loading && !error && result && <MatchResult result={result} />}
        </section>
      </div>
    </div>
  );
}

export default Analyzer;
