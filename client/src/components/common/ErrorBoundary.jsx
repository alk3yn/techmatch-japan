// src/components/common/ErrorBoundary.jsx
// Class component (React error boundaries can't be hooks yet). Catches
// render-time errors anywhere below it in the tree and shows a fallback
// instead of a blank white screen. i18next isn't reachable from a class
// component's render without extra wiring, so this reads the current
// language straight from localStorage/navigator rather than pulling in
// the hook-based translation API.

import { Component } from 'react';
import './ErrorBoundary.css';

const COPY = {
  ja: {
    title: '問題が発生しました',
    body: '予期しないエラーが発生しました。ページを再読み込みしてください。',
    reload: 'ページを再読み込み',
    home: 'ホームに戻る',
  },
  en: {
    title: 'Something went wrong',
    body: 'An unexpected error occurred. Please reload the page.',
    reload: 'Reload page',
    home: 'Back to home',
  },
};

function currentLang() {
  try {
    const stored = localStorage.getItem('techmatch_language');
    if (stored) return stored.startsWith('en') ? 'en' : 'ja';
  } catch {
    /* localStorage unavailable — fall through to default */
  }
  return 'ja';
}

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In a real deployment this is where an error-tracking call would go.
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const copy = COPY[currentLang()];
    return (
      <div className="error-boundary">
        <div className="error-boundary__card">
          <h1>{copy.title}</h1>
          <p>{copy.body}</p>
          <div className="error-boundary__actions">
            <button type="button" onClick={() => window.location.reload()}>
              {copy.reload}
            </button>
            <a href="/">{copy.home}</a>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
