import { useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  {
    label: "Dashboard",
    icon: "🏠",
    path: "/dashboard",
  },
  {
    label: "Upload CSV",
    icon: "📤",
    path: "/upload",
  },
  {
    label: "NIC Records",
    icon: "📋",
    path: "/records",
  },
  {
    label: "Reports",
    icon: "📊",
    path: "/reports",
  },
];

function Sidebar({ isOpen = false, onClose = () => {} }) {
  const navigate = useNavigate();
  const location = useLocation();

  const openPage = (path) => {
    navigate(path);
    onClose();
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("nicValidationResult");

    navigate("/");
    onClose();
  };

  return (
    <aside
      className={`dash-sidebar ${
        isOpen ? "dash-sidebar-open" : ""
      }`}
    >
      <div className="dash-logo">
        <div className="dash-logo-icon">N</div>

        <div>
          <h2>NIC System</h2>
          <p>Validation Portal</p>
        </div>
      </div>

      <nav className="dash-menu">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              type="button"
              className={`dash-menu-item ${
                isActive ? "dash-active" : ""
              }`}
              onClick={() => openPage(item.path)}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          );
        })}

        <button
          type="button"
          className="dash-menu-item"
        >
          <span>⚙️</span>
          Settings
        </button>
      </nav>

      <button
        type="button"
        className="dash-logout-button"
        onClick={handleLogout}
      >
        <span>🚪</span>
        Logout
      </button>
    </aside>
  );
}

export default Sidebar;
