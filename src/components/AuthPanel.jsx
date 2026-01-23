import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/AuthPanel.css';

export default function AuthPanel({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup, login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!displayName) {
          setError('Le nom est requis');
          setLoading(false);
          return;
        }
        await signup(email, password, displayName);
      }
      onClose();
    } catch (error) {
      console.error('Auth error:', error);
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Cet email est déjà utilisé');
          break;
        case 'auth/invalid-email':
          setError('Email invalide');
          break;
        case 'auth/weak-password':
          setError('Le mot de passe doit contenir au moins 6 caractères');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Email ou mot de passe incorrect');
          break;
        default:
          setError('Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-panel" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>
        
        <h2>{isLogin ? 'Connexion' : 'Inscription'}</h2>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Nom</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Votre nom"
                required={!isLogin}
              />
            </div>
          )}
          
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : "S'inscrire")}
          </button>
        </form>
        
        <div className="auth-toggle">
          {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
          <button 
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
