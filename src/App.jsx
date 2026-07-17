import { BrowserRouter,Routes,Route,} 
 
from "react-router-dom";

import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Pages/Dashboard";
import Upload from "./Upload";
import NicRecords from "./Pages/NicRecords";
import Reports from "./Pages/Reports";

function App() {
  return (
    <BrowserRouter> 
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/upload" element={<Upload />} />
        
        <Route path="/records" element={<NicRecords />} />
        <Route path="/reports" element={<Reports />} />
  
 

      </Routes>
    </BrowserRouter>
  );
}

export default App;