import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="eyebrow">GrindMap</p>
          <h3>Track goals. Build streaks. Stay consistent.</h3>
          <p className="footer-muted">
            A focused productivity tracker for coding practice and contests.
          </p>
        </div>

        <div className="footer-links">
          <div className="footer-col">
            <p className="footer-col-title">Product</p>
            <Link to="/goals">Goals</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/achievements">Achievements</Link>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Legal</p>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms & Conditions</Link>
          </div>

          <div className="footer-col">
            <p className="footer-col-title">Support</p>
            <a href="https://github.com/Yugenjr/GrindMap" target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href="mailto:support@grindmap.app">
              Contact
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} GrindMap — Built for consistent grinders.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
