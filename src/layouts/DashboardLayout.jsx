import { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link } from 'react-router';
import { DesktopOutlined, PieChartOutlined } from '@ant-design/icons';
import { Layout, Menu, theme, Button } from 'antd';
import { useAuthConfig } from '../context/AppState';
import Time from '../components/time/Time';
import axios from 'axios'; 
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import CryptoJS from 'crypto-js'; 
import * as jwt_decode from 'jwt-decode';

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

const items = [
  getItem('Dashboard', '/dashboard', <PieChartOutlined />),
  getItem('Staffs', '/dashboard/staffs', <DesktopOutlined />),
  getItem('Categories', '/dashboard/categories', <DesktopOutlined />),
  getItem('Products', '/dashboard/products', <DesktopOutlined />),
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const navigate = useNavigate();
  const { user, baseUrl } = useAuthConfig(); 

  let title = "Default Title";

  switch (location.pathname) {
    case "/dashboard":
      title = "Dashboard";
      break;
    case "/dashboard/profile":
      title = "Profile";
      break;
    case "/dashboard/categories":
      title = "Categories";
      break;
    case "/dashboard/products":
      title = "Products";
      break;
    case "/dashboard/staffs":
      title = "Staffs";
      break;
    default:
      break;
  }

  const {
    token: { colorBgContainer, borderRadiusLG },
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

    const encryptedToken = sessionStorage.getItem('token');

    if (!encryptedToken) {
      sessionStorage.clear();
      navigate('/');
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);
    // console.log('Decrypted Token:', decryptedToken);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate('/');
      return;
    }

    try {
      const decodedToken = jwt_decode(decryptedToken);
      const expirationTime = decodedToken.exp * 1000; 
      const currentTime = new Date().getTime();

      if (currentTime > expirationTime) {
        console.error('Token has expired');
        sessionStorage.clear();
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Token decode error:', error);
      sessionStorage.clear();
      navigate('/');
      return;
    }

    const headers = {
      Authorization: `Bearer ${decryptedToken}`, 
    };

    try {
      const response = await axios.post(logoutUrl, {}, { headers });
      if (response.status === 200) {
        sessionStorage.clear();
        navigate('/');
      }
    } catch (error) {
      console.error('Logout failed', error);
      alert('Logout failed. Please try again.');
    }
  };

  useEffect(() => {
    const encryptedToken = sessionStorage.getItem('token');

    if (!encryptedToken) {
      navigate('/');
      return;
    }

    const bytes = CryptoJS.AES.decrypt(encryptedToken, SECRET_KEY);
    const decryptedToken = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedToken) {
      sessionStorage.clear();
      navigate('/');
    }

    const tokenExpiration = sessionStorage.getItem('tokenExpiration');
    if (tokenExpiration && new Date().getTime() > tokenExpiration) {
      sessionStorage.clear();
      navigate('/');
    }
  }, [navigate]);

  return (
    <Layout
      style={{
        minHeight: '100vh',
      }}
    >
      {/* Sidebar */}
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          selectedKeys={[selectedKey]}
          mode="inline"
        >
          {items.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.key}>{item.label}</Link>
            </Menu.Item>
          ))}
        </Menu>
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          className='!px-3 flex items-center justify-between'
          style={{
            background: colorBgContainer,
          }}
        >
          <h3 className="header-title text-2xl">{title}</h3>
          <div className='flex items-center justify-between gap-3'>
            <h3 className="header-title text-1xl font-bold">Hi {user?.firstName}</h3>
            <Time />
            <Button onClick={showLogoutModal} type="primary" className='!bg-red-500 !border-none'>
              Logout
            </Button>
          </div>
        </Header>

        <Content className='p-2'>
          <Outlet />
        </Content>
      </Layout>

      {/* Logout Confirmation Modal */}
      <Dialog open={isModalVisible} onClose={handleCancel} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500/75 transition-opacity"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:size-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-gray-900">
                      Are you sure you want to log out?
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to log out? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 sm:ml-3 sm:w-auto"
                >
                  Log out
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 shadow-xs ring-gray-300 ring-inset hover:bg-gray-50 sm:mt-0 sm:w-auto"
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

export default DashboardLayout;
