
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaHome, FaBars, FaTimes, FaTachometerAlt, FaBox, FaShoppingBag } from 'react-icons/fa';
import '../../styles/components.css';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const { getCartCount, cart, cartUpdated } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Update cart count whenever cart changes
  useEffect(() => {
    console.log('🛒 Header - Cart updated, recalculating count');
    const count = getCartCount();
    console.log('🛒 Header - New cart count:', count);
    setCartCount(count);
  }, [getCartCount, cart, cartUpdated]);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  // Debug log
  console.log('🛒 Header - Rendering with cartCount:', cartCount);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  return (
    <header className="header">
      <div className="container header-container">
        {/* Logo */}
        <Link to="/" className="logo" onClick={closeMenus}>
          <div className="logo-icon">
            <FaHome />
          </div>
          <span className="logo-text">Tech Bazaar</span>
        </Link>

        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation */}
        <nav className={`nav ${mobileMenuOpen ? 'show' : ''}`}>
          <Link to="/" className="nav-link" onClick={closeMenus}>Home</Link>
          <Link to="/products" className="nav-link" onClick={closeMenus}>Products</Link>
          <Link to="/categories" className="nav-link" onClick={closeMenus}>
            Categories
          </Link>
          {isAdmin && (
            <Link to="/admin" className="nav-link" onClick={closeMenus}>Admin</Link>
          )}
        </nav>

        {/* User Actions */}
        <div className="header-actions">
          {isAuthenticated ? (
            <>
              {/* Show Cart only for regular users, not for admin */}
              {!isAdmin && (
                <Link to="/cart" className="cart-icon" onClick={closeMenus}>
                  <FaShoppingCart />
                  <span className="cart-badge">{cartCount > 0 ? cartCount : 0}</span>
                </Link>
              )}
              
              <div className="user-menu">
                <div className="user-avatar" onClick={toggleUserMenu}>
                  {user?.firstName?.charAt(0) || user?.first_name?.charAt(0) || <FaUser />}
                </div>
                
                <div className={`dropdown-menu ${userMenuOpen ? 'show' : ''}`}>
                  {/* User Info */}
                  <span className="dropdown-item" style={{ 
                    display: 'block',
                    padding: '12px 16px',
                    background: '#f9fafb',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <strong>{user?.firstName || user?.first_name} {user?.lastName || user?.last_name}</strong>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#6b7280',
                      marginTop: '4px'
                    }}>
                      {user?.email || 'user@example.com'}
                    </div>
                    {isAdmin && (
                      <div style={{ 
                        fontSize: '11px', 
                        color: '#059669',
                        marginTop: '4px',
                        padding: '2px 6px',
                        background: '#d1fae5',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        Administrator
                      </div>
                    )}
                  </span>

                  {/* ADMIN DROPDOWN OPTIONS */}
                  {isAdmin ? (
                    <>
                      <Link to="/admin" className="dropdown-item" onClick={closeMenus}>
                        <FaTachometerAlt style={{ marginRight: '8px' }} />
                        Admin Dashboard
                      </Link>
                      <Link to="/admin/products" className="dropdown-item" onClick={closeMenus}>
                        <FaBox style={{ marginRight: '8px' }} />
                        Manage Products
                      </Link>
                      <Link to="/admin/orders" className="dropdown-item" onClick={closeMenus}>
                        <FaShoppingBag style={{ marginRight: '8px' }} />
                        View Orders
                      </Link>
                      <Link to="/profile" className="dropdown-item" onClick={closeMenus}>
                        <FaUser style={{ marginRight: '8px' }} />
                        Profile Settings
                      </Link>
                    </>
                  ) : (
                    <>
                      {/* REGULAR USER DROPDOWN OPTIONS (WISHLIST REMOVED) */}
                      <Link to="/profile" className="dropdown-item" onClick={closeMenus}>
                        Profile
                      </Link>
                      <Link to="/orders" className="dropdown-item" onClick={closeMenus}>
                        My Orders
                      </Link>
                      {/* WISHLIST LINK REMOVED FROM HERE */}
                    </>
                  )}

                  {/* Logout Button - Common for both */}
                  <button
                    onClick={handleLogout}
                    className="dropdown-item"
                    style={{
                      color: '#dc2626',
                      borderTop: '1px solid #e5e7eb',
                      paddingTop: '12px',
                      marginTop: '4px'
                    }}
                  >
                    <FaSignOutAlt style={{ marginRight: '8px' }} /> Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" onClick={closeMenus}>
                Login
              </Link>
              <Link to="/register" className="btn btn-primary" onClick={closeMenus}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;