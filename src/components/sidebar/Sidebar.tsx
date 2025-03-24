import { useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router"; // Fixed import to use react-router-dom
import { AiOutlineDashboard, AiOutlineUser, AiOutlineShopping, AiOutlineBars, AiOutlineTag, AiOutlineProfile } from 'react-icons/ai';
import { RiStore2Line } from 'react-icons/ri';
import { MdBatchPrediction } from "react-icons/md";
import { SidebarHeader } from "./SidebarHeader"; // Assuming SidebarHeader is still needed
import React from "react";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if the current route is active
  const isActive = (to: string) => location.pathname === to;

  // Icons corresponding to routes
  const routeIcons = {
    "/dashboard": <AiOutlineDashboard size={20} />,
    "/dashboard/staffs": <AiOutlineUser size={20} />,
    // "/dashboard/suppliers": <AiOutlineShopping size={20} />,
    // "/dashboard/category": <AiOutlineBars size={20} />,
    "/dashboard/products": <AiOutlineTag size={20} />,
    // "/dashboard/orders": <AiOutlineProfile size={20} />,
    // "/dashboard/batch": <MdBatchPrediction size={20} />
  };

  // Static routes
  const routesToRender = [
    "/dashboard",
    "/dashboard/staffs",
    // "/dashboard/suppliers",
    // "/dashboard/category",
    "/dashboard/products",
    // "/dashboard/orders",
    // "/dashboard/batch"
  ];

  // Ensure the user is redirected if trying to access routes not in the sidebar
  useEffect(() => {
    if (!routesToRender.some(route => location.pathname.startsWith(route))) {
      navigate('/unauthorized'); // Redirect if unauthorized route
    }
  }, [location.pathname, navigate]);

  // Handle NavLink click
  const handleNavLinkClick = () => {
    // Placeholder for handleToggle() logic if needed
    // handleToggle();
  };

  return (
    <aside className="sidebar fixed bg-black h-screen">
      <SidebarHeader />
      <ul className="sidebar_list flex flex-col">
        {routesToRender.map((route, index) => (
          <NavLink
            key={index}
            to={route}
            className={`text-decoration-none capitalize text-white ${isActive(route) && "active-link sidebar-active"}`}
            onClick={handleNavLinkClick}
          >
            <div className="flex items-center gap-4 p-5 links">
              {routeIcons[route]}
              <span className="ml-2">{route.split("/").pop()}</span>
            </div>
          </NavLink>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
