// src/utils/jobs.js — small helpers shared by the Jobs pages.

export function getLang(i18n) {
  return (i18n.resolvedLanguage || i18n.language || 'ja').startsWith('en') ? 'en' : 'ja';
}

// Jobs carry both title_ja/title_en (and description_*). Pick the active
// language, falling back to the other one if a translation is missing.
export function pickLocalized(job, base, lang) {
  const other = lang === 'ja' ? 'en' : 'ja';
  return job[`${base}_${lang}`] || job[`${base}_${other}`] || '';
}

// A single yen amount as a short label, e.g. 400万円 / ¥4.0M
export function formatYenShort(value, lang) {
  if (value === null || value === undefined) return '—';
  return lang === 'ja'
    ? `${Math.round(value / 10000).toLocaleString()}万円`
    : `¥${(value / 1000000).toFixed(1)}M`;
}

export function formatSalaryRange(min, max, lang) {
  if (min == null && max == null) return '—';
  if (lang === 'ja') {
    return `${Math.round(min / 10000)}万〜${Math.round(max / 10000)}万円`;
  }
  return `¥${(min / 1000000).toFixed(1)}M – ¥${(max / 1000000).toFixed(1)}M`;
}
