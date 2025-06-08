import { JSX, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import man from '../assets/images/handball-man.svg';
import logo from '@renderer/assets/images/logo.png';
import usFlag from '@renderer/assets/images/us.png';
import siFlag from '@renderer/assets/images/si.png';

interface Language {
    code: string;
    name: string;
    flag: string;
}

interface HomeProps {
    onContinue: () => void
    onOpenFolder: () => Promise<string[]>
}

export const Home = ({ onContinue, onOpenFolder }: HomeProps): JSX.Element => {
    const { t, i18n } = useTranslation();
    
    const [selectedSport, setSelectedSport] = useState('Handball');
    const [folderSelected, setFolderSelected] = useState(false);
    
    const handleFolderSelect = async () => {
        const result = await onOpenFolder();
            if (result && Array.isArray(result) && result.length > 0)
                setFolderSelected(true); 
    };
    
    const handleContinue = () => {
        onContinue()
    };
    
    const languages: Language[] = [
        { code: 'en', name: 'English', flag: usFlag },
        { code: 'si', name: 'Slovenščina', flag: siFlag },
    ];
    
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(
        languages.find((l) => l.code === i18n.language) || languages[0]
    );

    const handleLanguageChange = (lang: Language) => {
        setSelectedLanguage(lang);
        i18n.changeLanguage(lang.code);
    };

    useEffect(() => {
        const lang = languages.find((l) => l.code === i18n.language)
        if (lang) setSelectedLanguage(lang)
    }, [i18n.language])

    return (
        <>
        <nav className="navbar fixed-top px-4" style={{ height: '64px', zIndex: 10 }}>
            <div className="container-fluid d-flex justify-content-end align-items-center">
                <div className="dropdown">
                    <button
                        className="btn btn-outline-dark dropdown-toggle d-flex align-items-center"
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
        <img src={man} className="handball-bg " alt="" />
            <div className="text-dark d-flex flex-column justify-content-center align-items-center" style={{ height: '90vh', paddingTop: '12vh', overflow: 'hidden' }}>
                <div className="text-center position-relative" style={{ zIndex: 1, maxWidth: '500px', width: '100%' }}>
                    <img src={logo} alt="Logo" width={100} className="mb-2" />
                    <h1 className="mb-3 fw-bold">GazePro</h1>
                    <h6 className="fw-normal">
                        {t('home.trainMind')} <span className="text-red-damask">{t('home.mind')}.</span> {t('home.sharpenReflex')} <span className="text-red-damask">{t('home.reflex')}.</span>
                    </h6>

                    <form onSubmit={(e) => e.preventDefault()}>
                        <div className="mb-3 mt-5 text-start">
                            <label className="form-label">{t('home.selectSport')}:</label>
                            <select
                                className="form-select"
                                value={selectedSport}
                                onChange={(e) => setSelectedSport(e.target.value)}
                                >
                                <option value="Handball">{t('home.handball')}</option>
                            </select>
                        </div>

                        <div className="mb-3 text-start">
                            <label className="form-label">{t('home.videoFolder')}:</label>
                            <button
                                type="button"
                                className="btn btn-red-damask w-100"
                                onClick={handleFolderSelect}
                                >
                                <i className="bi bi-folder2-open me-2" />
                                {folderSelected ? t('home.folderSelected') : t('openFolder')}
                            </button>
                        </div>

                        <button
                            type="button"
                            className="btn btn-red-damask w-100"
                            onClick={handleContinue}
                            disabled={!folderSelected}
                        >
                            {t('home.continue')} <i className="bi bi-arrow-right ms-2" />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};
