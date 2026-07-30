import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoutOverlay from "../LogoutOverlay";

// Define the label, icon, and route for every sidebar menu button.
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
  // Router helpers used for navigation and active-page detection.
  const navigate = useNavigate();
  const location = useLocation();

  // Control the loading overlay and prevent repeated logout actions.
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Navigate to the selected page and close the mobile sidebar.
  const openPage = (path) => {
    navigate(path);
    onClose();
  };

  // Clear login and validation data before returning to the login page.
  const handleLogout = () => {
    // Ignore extra clicks while logout is already in progress.
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    // Keep the overlay visible briefly so the logout state is clear.
    window.setTimeout(() => {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("nicValidationResult");

      // Return to login and reset the mobile sidebar state.
      navigate("/");
      onClose();
    }, 800);
  };

  return (
    <>
      {/* Add the open class when the mobile sidebar should be visible. */}
      <aside
      className={`dash-sidebar ${
        isOpen ? "dash-sidebar-open" : ""
      }`}
    >
      {/* Application name and logo displayed above the menu. */}
      <div className="dash-logo">
        <div className="dash-logo-icon">N</div>

        <div>
          <h2>NIC System</h2>
          <p>Validation Portal</p>
        </div>
      </div>

      {/* Create one navigation button from each menu configuration. */}
      <nav className="dash-menu">
        {menuItems.map((item) => {
          // Highlight the menu button for the current route.
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

      </nav>

      {/* Disable logout after the first click to prevent duplicates. */}
      <button
        type="button"
        className="dash-logout-button"
        onClick={handleLogout}
        disabled={isLoggingOut}
      >
        <span>🚪</span>
        Logout
      </button>
      </aside>

      {/* Cover the page with feedback while logout is completing. */}
      {isLoggingOut && <LogoutOverlay />}
    </>
  );
}

export default Sidebar;
