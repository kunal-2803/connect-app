import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import './DashboardLayout.css';
import { FaCompass, FaEnvelope, FaUserFriends, FaUserCircle } from 'react-icons/fa';

const navItems = [
  { name: 'Discover', path: '/dashboard/discover', icon: <FaCompass /> },
  { name: 'Messages', path: '/dashboard/messages', icon: <FaEnvelope /> },
  { name: 'My Connections', path: '/dashboard/connections', icon: <FaUserFriends /> },
  { name: 'My Profile', path: '/dashboard/profile', icon: <FaUserCircle /> },
];

const DashboardLayout = () => {
  const location = useLocation();

  return (
    <div className="dashboard-layout">
      <nav className="dashboard-nav">
        <div className="dashboard-nav-logo">IntiMate</div>
        <ul>
          {navItems.map(item => (
            <li key={item.name} className={location.pathname.startsWith(item.path) ? 'active' : ''}>
              <Link to={item.path}>
                {item.icon}
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <main className="dashboard-content">
        <Outlet /> {/* This is where nested route components will render */}
      </main>
    </div>
  );
};

export default DashboardLayout;