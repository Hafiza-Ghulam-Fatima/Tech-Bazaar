import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import '../../styles/components.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Tech Bazaar</h3>
            <p>Your one-stop shop for all electronic devices. Quality products at competitive prices.</p>
            <div className="social-links d-flex gap-2 mt-2">
              <a href="#" className="btn btn-secondary btn-sm"><FaFacebook /></a>
              <a href="#" className="btn btn-secondary btn-sm"><FaTwitter /></a>
              <a href="#" className="btn btn-secondary btn-sm"><FaInstagram /></a>
              <a href="#" className="btn btn-secondary btn-sm"><FaLinkedin /></a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Categories</h3>
            <ul className="footer-links">
              <li><Link to="/category/smartphones">Smartphones</Link></li>
              <li><Link to="/category/laptops">Laptops</Link></li>
              <li><Link to="/category/tablets">Tablets</Link></li>
              <li><Link to="/category/wearables">Wearables</Link></li>
              <li><Link to="/category/audio">Audio</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact Info</h3>
            <ul className="footer-links">
              <li><FaMapMarkerAlt /> 123 Tech Street, Silicon Valley, CA</li>
              <li><FaPhone /> +1 (555) 123-4567</li>
              <li><FaEnvelope /> info@techbazaar.com</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Tech Bazaar. All rights reserved.</p>
          <p>
            <Link to="/privacy" className="mr-2">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;