import { useState, useEffect } from "react";
import { Outlet, useNavigate, Link } from "react-router";
import { DesktopOutlined, PieChartOutlined } from "@ant-design/icons";
import { Layout, Menu, theme, Button } from "antd";
import { useAuthConfig } from "../context/AppState";
import Time from "../components/time/Time";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CryptoJS from "crypto-js";
import * as jwt_decode from "jwt-decode";
import axios from "axios";

const SECRET_KEY = 'mySecretKey';

const { Header, Content, Sider } = Layout;

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

// Define your menu items here
const items = [
  getItem("Dashboard", "/staff-dashboard", <PieChartOutlined />),
  getItem("Store", "/staff-dashboard/store", <DesktopOutlined />),
];

const StaffDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { user, baseUrl } = useAuthConfig(); 

  let title = "Default Title";

  switch (location.pathname) {
    case "/staff-dashboard":
      title = "Dashboard";
      break;
    case "/staff-dashboard/store":
      title = "Store";
      break;
    default:
      break;
  }

  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const selectedKey = location.pathname;

  const showLogoutModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleLogout = async () => {
    setIsModalVisible(false);

    const logoutUrl = `${baseUrl}/logout`;
    const encryptedToken = sessionStorage.getItem("token");

    if (!encryptedToken) {
      sessionStorage.clear();
      navigate("/");
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate("/");
      return;
    }

    try {
      const decodedToken = jwt_decode(decryptedToken);
      const expirationTime = decodedToken.exp * 1000;
      const currentTime = new Date().getTime();

      if (currentTime > expirationTime) {
        sessionStorage.clear();
        navigate("/");
        return;
      }
    } catch (error) {
      console.error("Token decode error:", error);
      sessionStorage.clear();
      navigate("/");
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${decryptedToken}`,
      };

      const response = await axios.post(logoutUrl, {}, { headers });
      if (response.status === 200) {
        sessionStorage.clear();
        navigate("/");
      }
    } catch (error) {
      console.error("Logout failed", error);
      alert("Logout failed. Please try again.");
    }
  };

  useEffect(() => {
    const encryptedToken = sessionStorage.getItem("token");

    if (!encryptedToken) {
      navigate("/");
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate("/");
    }

    const tokenExpiration = sessionStorage.getItem("tokenExpiration");
    if (tokenExpiration && new Date().getTime() > tokenExpiration) {
      sessionStorage.clear();
      navigate("/");
    }
  }, [navigate]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
        >
          {items.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.key}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        {/* Responsive Fixed Header */}
        <Header
          className="transition-all duration-300"
          style={{
            position: "fixed",
            top: 0,
            zIndex: 10,
            width: `calc(100% - ${collapsed ? 80 : 200}px)`,
            left: collapsed ? 80 : 200,
            background: colorBgContainer,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingInline: 16,
          }}
        >
          <h3 className="text-2xl font-semibold">{title}</h3>
          <div className="flex items-center gap-4">
            <h3 className="text-md font-bold">Hi {user?.firstName}</h3>
            <Time />
            <Button
              onClick={showLogoutModal}
              type="primary"
              className="!bg-red-500 !border-none"
            >
              Logout
            </Button>
          </div>
        </Header>

        {/* Main Content */}
        <Content
          className="p-4"
          style={{ marginTop: 64, transition: "margin-left 0.2s" }}
        >
          <Outlet />
          {/* Example of responsive cards (you can move this inside your page components) */}
          {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white p-4 shadow rounded">
              <img src="/your-image.jpg" className="w-full h-40 object-cover rounded" alt="card" />
              <h2 className="mt-2 font-semibold text-lg">Title</h2>
              <p className="text-gray-600">Card description text goes here.</p>
            </div>
          </div> */}
        </Content>
      </Layout>

      {/* Logout Confirmation Modal */}
      <Dialog open={isModalVisible} onClose={handleCancel} className="relative z-10">
        <DialogBackdrop className="fixed inset-0 bg-gray-500/75" />
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:w-full sm:max-w-lg">
              <div className="bg-white p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-lg font-medium text-gray-900">
                      Are you sure you want to log out?
                    </DialogTitle>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleLogout}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Log out
                </button>
                <button
                  onClick={handleCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </Layout>
  );
};

export default StaffDashboardLayout;
