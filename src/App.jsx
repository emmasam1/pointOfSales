import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/admin/Dashboard";
import Product from "./pages/admin/Product";
import Staff from "./pages/admin/Staff";
import { AuthConfigProvider } from "./context/AppState";

const App = () => {
  return (
    <AuthConfigProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/otp-verification" element={<Verify />} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="" element={<Dashboard />} />
            <Route path="products" element={<Product />} />
            <Route path="staffs" element={<Staff />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthConfigProvider>
  );
};

export default App;
