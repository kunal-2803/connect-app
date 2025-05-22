import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Create this CSS file

const Navbar = ({ isAuthenticated, user, onLoginClick, onSignupClick, onLogoutClick }) => {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">IntiMate</Link>
      <div className="navbar-auth-buttons">
        {isAuthenticated ? (
          <>
            <span className="navbar-welcome">Welcome, {user?.username || user?.email}!</span>
            {user?.isVerified === false && <span className="navbar-unverified">(Not Verified)</span>}
            <button onClick={onLogoutClick} className="navbar-button logout-button">Logout</button>
          </>
        ) : (
          <>
            <button onClick={onLoginClick} className="navbar-button">Login</button>
            <button onClick={onSignupClick} className="navbar-button signup-button">Sign Up</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;