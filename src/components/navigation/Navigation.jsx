import { Dropdown } from "antd";
import { MenuOutlined, BellOutlined, CloseOutlined } from '@ant-design/icons';
import { Link, useNavigate } from "react-router"; // Fixed import to react-router-dom
// import logo from "../../assets/image/logo.webp"; // Add logo import as needed
import Time from "../time/Time"; // Ensure your Time component is correctly imported

const Navigation = ({ title }) => {
  const navigate = useNavigate();

  const toggleDropdown = () => {
    const dropdown = document.getElementById("userDropdown");
    if (dropdown) {
      dropdown.classList.toggle("hidden");
    }
  };

  const handleToggle = () => {
    // Add your toggle logic here
  };

  const handleLogout = () => {
    // Assuming you have a logout function
    logout(navigate);
  };

  const notifications = [
    "Lorem Ipsum is simply...",
    "Notification 2",
    "Notification 3",
    "Notification 4",
    "Notification 5",
    "Notification 6",
    "Notification 7",
    "Notification 8",
    "Notification 9",
    "Notification 10",
  ];

  const menu = {
    items: notifications.map((notification, index) => ({
      key: index,
      label: notification,
    })),
  };

  return (
    <div className="nav_bar fixed w-[82%] z-50 bg-red-300">
      <div className="flex justify-between">
        {/* Toggle Menu Icon */}
        {ontoggle ? (
          <CloseOutlined className="navbar__menu" onClick={handleToggle} />
        ) : (
          <MenuOutlined className="navbar__menu" onClick={handleToggle} />
        )}

        <div className="navbar__left">
          <h2>{title}</h2>
        </div>

        <div className="flex items-center justify-between w-48">
          {/* Notifications */}
          <Dropdown menu={menu} trigger={["click"]}>
            <div className="relative cursor-pointer">
              <div className="absolute right-0">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative rounded-full h-4 w-4 bg-red-700 text-white flex items-center justify-center pt-[3px] bell-text-size">
                    10
                  </span>
                </span>
              </div>
              <BellOutlined style={{ fontSize: 30 }} />
            </div>
          </Dropdown>

          {/* Time Component */}
          <Time />

          {/* User Avatar and Dropdown */}
          <div className="relative">
            {/* <img
              id="avatarButton"
              type="button"
              data-dropdown-toggle="userDropdown"
              data-dropdown-placement="bottom-start"
              className="w-10 h-10 rounded-full cursor-pointer"
              src={logo}
              alt="User dropdown"
              onClick={toggleDropdown}
            /> */}

            {/* User Dropdown */}
            <div
              id="userDropdown"
              className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-56 dark:bg-gray-700 dark:divide-gray-600 absolute right-10"
            >
              <ul
                className="py-2 text-sm text-gray-700 dark:text-gray-200"
                aria-labelledby="avatarButton"
              >
                <li>
                  <Link
                    to="profile"
                    onClick={toggleDropdown}
                    className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                  >
                    Profile
                  </Link>
                </li>
              </ul>
              <div className="py-1">
                <Link
                  to="#"
                  onClick={toggleDropdown}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                >
                  <button
                    className="text-red-600 border-none font-bold text-lg"
                    onClick={handleLogout}
                  >
                    Sign out
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Logout function - Make sure to implement it properly
function logout(_navigate) {
  throw new Error("Function not implemented.");
}

export default Navigation;
