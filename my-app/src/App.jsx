// React Router components used to connect URLs to application pages.
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

// Import every page that can be opened through the router.
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Pages/Dashboard";
import Upload from "./Upload";
import NicRecords from "./Pages/NicRecords";
import Reports from "./Pages/Reports";

function App() {
  // BrowserRouter keeps the displayed page synchronized with the URL.
  return (
    <BrowserRouter>
      {/* Routes checks the current URL and renders the matching route. */}
      <Routes>
        {/* Authentication pages. */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main system pages available after login. */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/records" element={<NicRecords />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
