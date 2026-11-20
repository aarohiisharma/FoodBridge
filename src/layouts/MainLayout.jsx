import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/layouts.css';

/**
 * Layout for public pages (Login, Register, etc.).
 *
 * Structure: Navbar → page content (via <Outlet />) → Footer
 */
function MainLayout() {
  return (
    <div className="main-layout">
      <Navbar />
      <main className="main-layout__content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
