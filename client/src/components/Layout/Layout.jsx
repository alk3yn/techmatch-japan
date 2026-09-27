// src/components/Layout/Layout.jsx
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

function Layout() {
  return (
    <div className="app-shell">
      <Header />
      <main className="container app-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default Layout;
