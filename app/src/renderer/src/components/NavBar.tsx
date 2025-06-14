import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'

import logo from '@renderer/assets/images/logo-2.png';
import usFlag from '@renderer/assets/images/us.png';
import siFlag from '@renderer/assets/images/si.png';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export const NavBar = () => {
  const navigate = useNavigate();

  const { t, i18n } = useTranslation()

  const navItems = [
    { label: t('videoEditor'), path: '/' },
    { label: t('savedVideos'), path: '/saved' },
    { label: t('trainingModule'), path: '/training' },
  ]

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: usFlag },
    { code: 'si', name: 'Slovenščina', flag: siFlag },
  ];

  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    languages.find((l) => l.code === i18n.language) || languages[0]
  );

  const [activeLabel, setActiveLabel] = useState(navItems[0].label);

  const handleClick = (label: string, path: string) => {
    setActiveLabel(label);
    navigate(path);
  };
  
  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang)
    i18n.changeLanguage(lang.code)
  }

  useEffect(() => {
    const found = languages.find((l) => l.code === i18n.language);
    if (found) setSelectedLanguage(found);
  }, [i18n.language]);

  return (
    <nav className="navbar bg-dark text-white px-4 shadow-sm fixed-top" style={{ height: '64px', zIndex: 10 }}>
      <div className="container-fluid d-flex justify-content-between align-items-center">

        {/* Left: Brand */}
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="Logo" width={40} />
          <span className="navbar-brand mb-0 ms-1 h1 text-white fs-5"><span>GazePro</span> Reflex Training</span>
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
                  onClick={() => handleLanguageChange(lang)}
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
