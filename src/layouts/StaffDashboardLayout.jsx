import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router'; // Use Link from react-router-dom
import {
  DesktopOutlined,
  PieChartOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';
import { useAuthConfig } from '../context/AppState';
import Time from '../components/time/Time';

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
  getItem('Dashboard', '/dashboard', <PieChartOutlined />),
  getItem('Store', '/staff-dashboard/store', <DesktopOutlined />),
];

const StaffDashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user } = useAuthConfig(); // Access the user from context

  let title = "Default Title";

  // Switch for updating title based on the current route path
  switch (location.pathname) {
    case "/staff-dashboard":
      title = "Dashboard";
      break;
    case "/staff-dashboard/store":
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

  // Set the selected key for the menu based on location.pathname
  const selectedKey = location.pathname;

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
          selectedKeys={[selectedKey]}  // This will ensure the active menu item is based on the current location
          mode="inline"
        >
          {items.map(item => (
            <Menu.Item key={item.key} icon={item.icon}>
              <Link to={item.key}>{item.label}</Link> {/* Wrap Menu.Item with Link */}
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
          </div>
        </Header>

        <Content className='p-2'>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default StaffDashboardLayout;
