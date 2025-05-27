import { Link, useLocation } from 'react-router-dom';

import logo from '@renderer/assets/images/logo-placeholder.png';
import usFlag from '@renderer/assets/images/us.png';
import siFlag from '@renderer/assets/images/si.png';


export const NavBar = () => {
  const location = useLocation();
  
  const navItems = [
    { label: 'Video Editor', path: '/' },
    { label: 'Saved Videos', path: '/saved' },
    { label: 'Training Module', path: '/training' },
  ];


  return (
    <nav className="navbar bg-dark text-white px-4 shadow-sm fixed-top" style={{ height: '64px', zIndex: 10 }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">

        {/* Left: Brand */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="Logo" width={32} height={32} />
          <span className="navbar-brand mb-0 h1 text-white fs-4">GazePro</span>
        </div>

        {/* Center: Navigation Links */}
        <div className="d-flex gap-4">
          {navItems.map(({ label, path }) => (
            <Link
              key={label}
              to={path}
              className={`nav-link fw-medium ${location.pathname === path ? 'text-red-damask' : 'text-white'}`}
              style={{ fontSize: '15px' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right: Language Dropdown */}
        <div className="dropdown">
          <button
            className="btn btn-outline-light dropdown-toggle d-flex align-items-center"
            type="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img src={usFlag} alt="English" width={16} height={16} className="me-2" />
            English
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            <li>
              <a className="dropdown-item d-flex align-items-center" href="#">
                <img src={usFlag} alt="English" width={16} height={16} className="me-2" />
                English
              </a>
            </li>
            <li>
              <a className="dropdown-item d-flex align-items-center" href="#">
                <img src={siFlag} alt="Slovenščina" width={16} height={16} className="me-2" />
                Slovenščina
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
