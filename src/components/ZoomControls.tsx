import '../styles/ZoomControls.css';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onCenter: () => void;
  showCenter: boolean;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset, onCenter, showCenter }: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <button onClick={onZoomIn} title="Zoom +">+</button>
      <span className="zoom-controls__level">{Math.round(zoom * 100)}%</span>
      <button onClick={onZoomOut} title="Zoom -">−</button>
      <button onClick={onReset} title="Réinitialiser">⟲</button>
      {showCenter && (
        <button onClick={onCenter} title="Centrer sur la station">◎</button>
      )}
    </div>
  );
}
