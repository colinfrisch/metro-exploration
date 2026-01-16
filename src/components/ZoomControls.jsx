import '../styles/ZoomControls.css';

export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset, onCenter, showCenter }) {
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
