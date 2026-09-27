// src/components/Layout/Footer.jsx
import './Footer.css';

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <span>© {year} TechMatch Japan — portfolio project, sample data only</span>
        <span className="site-footer__author">
          Built by Tejas Agrawal ·{' '}
          <a href="https://tejas-agrawal.web.app" target="_blank" rel="noreferrer">
            Portfolio
          </a>
        </span>
      </div>
    </footer>
  );
}

export default Footer;
