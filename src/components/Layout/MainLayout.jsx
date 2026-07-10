import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout({ children }) {
  return (
    <div className="layout">

      <Sidebar />

      <div className="content">

        <Topbar />

        <main className="page-content">
          {children}
        </main>

      </div>

    </div>
  );
}