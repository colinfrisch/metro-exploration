import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useCity } from '../contexts/CityContext';
import AuthPanel from './AuthPanel';
import UserProfile from './UserProfile';
import CitySelector from './CitySelector';
import '../styles/Header.css';

export default function Header() {
  const { currentUser } = useAuth();
  const { cityConfig } = useCity();
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="header">
      <div className="header__left">
        <CitySelector />
      </div>

      <div className="header__center">
        <div className="header__title">
          <span className="header__title-line header__title-line--1">M</span>
          <span className="header__title-line header__title-line--4">é</span>
          <span className="header__title-line header__title-line--7">t</span>
          <span className="header__title-line header__title-line--9">r</span>
          <span className="header__title-line header__title-line--11">o</span>
          <span className="header__title-text">Roulette</span>
        </div>
        <p className="header__subtitle">
          {cityConfig.language === 'fr' 
            ? "Où va-t-on déposer la petite meuf ?" 
            : "Where will the roulette take you?"}
        </p>
      </div>
      
      <div className="header__auth">
        {currentUser ? (
          <button 
            className="header__user-button"
            onClick={() => setShowProfile(true)}
          >
            <span className="user-avatar">
              {currentUser.displayName?.charAt(0).toUpperCase() || '?'}
            </span>
            <span className="user-name">{currentUser.displayName}</span>
          </button>
        ) : (
          <button 
            className="header__login-button"
            onClick={() => setShowAuthPanel(true)}
          >
            {cityConfig.language === 'fr' ? 'Se connecter' : 'Sign in'}
          </button>
        )}
      </div>

      {showAuthPanel && <AuthPanel onClose={() => setShowAuthPanel(false)} />}
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}
    </header>
  );
}
