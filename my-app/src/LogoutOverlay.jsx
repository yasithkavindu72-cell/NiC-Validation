function LogoutOverlay() {
  return (
    <div className="login-loading-overlay" role="status" aria-live="polite">
      <div className="login-loading-content">
        <span className="login-loading-spinner logout-loading-spinner" aria-hidden="true" />
        <strong>Signing you out</strong>
        <span>Please wait a moment...</span>
      </div>
    </div>
  );
}

export default LogoutOverlay;
