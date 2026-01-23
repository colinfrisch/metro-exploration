import { AuthProvider } from './contexts/AuthContext';
import { CityProvider } from './contexts/CityContext';
import Game from './components/Game';

export default function App() {
  return (
    <CityProvider>
      <AuthProvider>
        <div className="app">
          <Game />
        </div>
      </AuthProvider>
    </CityProvider>
  );
}
