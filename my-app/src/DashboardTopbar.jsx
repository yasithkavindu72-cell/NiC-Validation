function DashboardTopbar() {
  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  })();

  return (
    <header className="page-dashboard-topbar">
      <div>
        <h1>Dashboard</h1>
        <p>NIC Validation System Overview</p>
      </div>

      <div className="dash-user-section">
        <div className="dash-avatar">
          {user?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="dash-user-info">
          <strong>{user?.username || "User"}</strong>
          <span>{user?.role || "user"}</span>
        </div>
      </div>
    </header>
  );
}

export default DashboardTopbar;
