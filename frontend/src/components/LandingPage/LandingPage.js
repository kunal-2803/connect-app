import React from 'react';
import './LandingPage.css'; // Create this CSS file
import { FaUserCheck, FaShieldAlt, FaImages, FaCalendarAlt, FaLock } from 'react-icons/fa'; // npm install react-icons

const LandingPage = ({ onSignupClick }) => {
  return (
    <div className="landing-page">
      <header className="hero-section">
        <div className="hero-content">
          <h1>IntiMate: Connect. Explore. Securely.</h1>
          <p className="subtitle">
            Where genuine connections flourish. Verified profiles, mutual consent, and discreet experiences for cuckold couples and bulls.
          </p>
          <button onClick={onSignupClick} className="cta-button">Join IntiMate Now</button>
        </div>
      </header>

      <section className="features-section">
        <h2>Why Choose IntiMate?</h2>
        <div className="features-grid">
          <div className="feature-item">
            <FaUserCheck size={40} className="feature-icon" />
            <h3>Verified Profiles</h3>
            <p>Authenticity Guaranteed. Every active profile is genuine, ensuring you connect with real, sincere individuals. No fakes, only real connections.</p>
          </div>
          <div className="feature-item">
            <FaShieldAlt size={40} className="feature-icon" />
            <h3>Safety First</h3>
            <p>Your privacy and security are paramount. We employ robust measures and foster a community built on respect and consent.</p>
          </div>
          <div className="feature-item">
            <FaImages size={40} className="feature-icon" />
            <h3>Mutual Photo Sharing</h3>
            <p>Control your visibility. Photos are shared based on mutual agreement, preventing unwanted exposure and scams.</p>
          </div>
          <div className="feature-item">
            <FaCalendarAlt size={40} className="feature-icon" />
            <h3>Easy Scheduling</h3>
            <p>Coordinate your encounters effortlessly with our intuitive and discreet meeting scheduling tools.</p>
          </div>
          <div className="feature-item">
            <FaLock size={40} className="feature-icon" />
            <h3>Discreet & Respectful</h3>
            <p>Join a community that understands your desires and values discretion and mutual respect above all.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© {new Date().getFullYear()} IntiMate. All rights reserved. Explore Responsibly.</p>
      </footer>
    </div>
  );
};

export default LandingPage;