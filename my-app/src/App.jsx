import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Upload from "./Upload";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;