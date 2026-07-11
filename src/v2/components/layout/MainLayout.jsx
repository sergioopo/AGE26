const navItems = [
    ["dashboard", "Dashboard"],
    ["historical", "Histórico"],
    ["simulator", "Distribución"],
    ["analysis", "Análisis"],
    ["newScores", "Notas nuevas"],
];

export default function MainLayout({ children, activePage, onNavigate, isDark, onToggleTheme }){

    return(

        <div className="app-shell">

            <aside className="sidebar">

                <div className="sidebar-logo">
                    <img src="/castelukii.jpg" alt="Castelukii" />
                </div>

                <nav className="sidebar-nav">

                    {navItems.map(([id, label]) => <button key={id} type="button" className={`sidebar-link ${activePage === id ? "active" : ""}`} onClick={() => onNavigate(id)}>{label}</button>)}

                </nav>

            </aside>

            <main className="main-content">

                <header className="topbar">

                    <div className="topbar-title">

                        AGE Statistical Intelligence System

                    </div>

                    <div className="topbar-right">
                        <span>Convocatoria 2025</span>
                        <button className="theme-toggle" type="button" onClick={onToggleTheme} aria-pressed={isDark} aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}>
                            <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
                            {isDark ? "Claro" : "Oscuro"}
                        </button>
                    </div>

                </header>

                <section className="page">

                    {children}

                </section>

            </main>

        </div>

    );

}
