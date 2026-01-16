import '../styles/SettingsPanel.css';

export default function SettingsPanel({ apiKey, onApiKeyChange, isOpen, onToggle }) {
  return (
    <div className={`settings ${isOpen ? 'settings--open' : ''}`}>
      <button className="settings__toggle" onClick={onToggle}>
        ⚙️ {isOpen ? 'Fermer' : 'Paramètres'}
      </button>
      
      {isOpen && (
        <div className="settings__content">
          <label>🔑 Clé API Mistral</label>
          <input
            type="password"
            placeholder="Entrez votre clé API..."
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
          />
          <p className="settings__hint">
            <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer">
              Obtenir une clé →
            </a>
          </p>
          {apiKey && <span className="settings__status">✓ Clé enregistrée</span>}
        </div>
      )}
    </div>
  );
}
