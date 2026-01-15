import '../styles/Legend.css';

export default function Legend({ lines, onHoverLine, highlightedLine }) {
  return (
    <div className="legend">
      <h3 className="legend__title">Lignes de Métro</h3>
      <div className="legend__grid">
        {lines.map((line) => (
          <div
            key={line.id}
            className={`legend__item ${highlightedLine === line.id ? 'legend__item--active' : ''}`}
            onMouseEnter={() => onHoverLine(line.id)}
            onMouseLeave={() => onHoverLine(null)}
          >
            <span
              className="legend__badge"
              style={{
                backgroundColor: line.color,
                color: line.textColor
              }}
            >
              {line.id}
            </span>
            <span className="legend__name">{line.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
