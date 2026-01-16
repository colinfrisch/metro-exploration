import '../styles/Header.css';

export default function Header() {
  return (
    <header className="header">
      <div className="header__title">
        <span className="header__title-line header__title-line--1">M</span>
        <span className="header__title-line header__title-line--4">é</span>
        <span className="header__title-line header__title-line--7">t</span>
        <span className="header__title-line header__title-line--9">r</span>
        <span className="header__title-line header__title-line--11">o</span>
        <span className="header__title-text">Roulette</span>
      </div>
      <p className="header__subtitle">Où va-t-on déposer la petite meuf ?</p>
    </header>
  );
}
