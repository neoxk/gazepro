import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import logo from '@renderer/assets/images/logo-placeholder.png';
import usFlag from '@renderer/assets/images/us.png';
import siFlag from '@renderer/assets/images/si.png';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export const NavBar = () => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Video Editor', path: '/' },
    { label: 'Saved Videos', path: '/saved' },
    { label: 'Training Module', path: '/training' },
  ];

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: usFlag },
    { code: 'si', name: 'Slovenščina', flag: siFlag },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [activeLabel, setActiveLabel] = useState(navItems[0].label);

  const handleClick = (label: string, path: string) => {
    setActiveLabel(label);
    navigate(path);
  };

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
            <span
              key={label}
              onClick={() => handleClick(label, path)}
              className={`fw-medium nav-link ${activeLabel === label ? 'text-red-damask' : 'text-white'}`}
              style={{ fontSize: '15px', cursor: 'pointer' }}
            >
              {label}
            </span>
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
            <img src={selectedLanguage.flag} alt={selectedLanguage.name} width={16} height={16} className="me-2" />
            {selectedLanguage.name}
          </button>
          <ul className="dropdown-menu dropdown-menu-end">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  className="dropdown-item d-flex align-items-center"
                  onClick={() => setSelectedLanguage(lang)}
                >
                  <img src={lang.flag} alt={lang.name} width={16} height={16} className="me-2" />
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
};
