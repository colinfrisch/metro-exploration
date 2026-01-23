import { useAuth } from '../contexts/AuthContext';
import '../styles/UserProfile.css';

export default function UserProfile({ onClose }) {
  const { currentUser, userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!currentUser || !userProfile) return null;

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>✕</button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {userProfile.displayName?.charAt(0).toUpperCase()}
          </div>
          <h2>{userProfile.displayName}</h2>
          <p className="profile-email">{currentUser.email}</p>
        </div>
        
        <div className="profile-stats">
          <div className="stat-item">
            <div className="stat-value">{userProfile.gamesPlayed || 0}</div>
            <div className="stat-label">Parties jouées</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-value">{userProfile.stationsVisited?.length || 0}</div>
            <div className="stat-label">Stations visitées</div>
          </div>
          
          <div className="stat-item">
            <div className="stat-value">{userProfile.achievements?.length || 0}</div>
            <div className="stat-label">Succès</div>
          </div>
        </div>
        
        <div className="profile-info">
          <p className="member-since">
            Membre depuis {new Date(userProfile.createdAt).toLocaleDateString('fr-FR', { 
              year: 'numeric', 
              month: 'long' 
            })}
          </p>
        </div>
        
        <button className="logout-button" onClick={handleLogout}>
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
