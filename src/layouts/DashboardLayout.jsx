import { useState } from 'react';
import { Outlet, useLocation, Link } from 'react-router'; // Use Link from react-router-dom
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Layout, Menu, theme } from 'antd';

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
  getItem('Staffs', '/dashboard/staffs', <DesktopOutlined />),
  getItem('Products', '/dashboard/products', <DesktopOutlined />),
];

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  let title = "Default Title";

  // Switch for updating title based on the current route path
  switch (location.pathname) {
    case "/dashboard":
      title = "Dashboard";
      break;
    case "/dashboard/profile":
      title = "Profile";
      break;
    case "/dashboard/createstaff":
      title = "Create Staff";
      break;
    case "/dashboard/staffs":
      title = "Staffs";
      break;
    case "/dashboard/suppliers":
      title = "Suppliers";
      break;
    case "/dashboard/category":
      title = "Categories";
      break;
    case "/dashboard/products":
      title = "Products";
      break;
    case "/dashboard/batch":
      title = "Product Batch";
      break;
    case "/dashboard/option2":
      title = "Option 2";
      break;
    case "/dashboard/user":
      title = "User Section";
      break;
    default:
      break;
  }

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

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
          selectedKeys={[location.pathname]}
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
          style={{
            padding: 0,
            background: colorBgContainer,
          }}
        >
          <div className="header-title">{title}</div>
        </Header>

        <Content >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
