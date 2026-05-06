import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./routesweb/Dashboard.jsx";
import AdminDashboard from "./routesweb/Admin.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Dashboard es ahora la ruta principal (/) */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Admin ahora accesible en /admin (pero sin botones públicos) */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Mantenemos la ruta larga por si acaso la prefieres */}
        <Route path="/admin-panel-restaurante-oculto" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
