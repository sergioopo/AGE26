import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="sidebar">

      <div className="sidebar-logo">

        <h2>AGE</h2>

        <span>Statistical Intelligence</span>

      </div>

      <nav className="sidebar-nav">

        <NavLink to="/">Dashboard</NavLink>

        <NavLink to="/historical">Histórico</NavLink>

        <NavLink to="/distribution">Distribuciones</NavLink>

        <NavLink to="/simulator">Simulador</NavLink>

        <NavLink to="/model">Modelo</NavLink>

        <NavLink to="/backtesting">Backtesting</NavLink>

        <NavLink to="/conclusions">Conclusiones</NavLink>

        <NavLink to="/v2">Dashboard V2</NavLink>

      </nav>

    </aside>
  );
}
