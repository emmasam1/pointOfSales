import { BrowserRouter, Routes, Route } from "react-router";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Verify from "./pages/auth/Verify";
import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/admin/Dashboard";
import Product from "./pages/admin/Product";
import Staff from "./pages/admin/Staff";
import { AuthConfigProvider } from "./context/AppState";
import Categories from "./pages/admin/Categories";
import StaffDashboardLayout from "./layouts/StaffDashboardLayout";
import StaffDashboard from "./pages/staff/StaffDashboard";
import Store from "./pages/staff/Store";

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
            <Route path="categories" element={<Categories />} />
          </Route>
          <Route path="/staff-dashboard" element={<StaffDashboardLayout />}>
            <Route path="" element={<StaffDashboard />} />
            <Route path="store" element={<Store />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthConfigProvider>
  );
};

export default App;
