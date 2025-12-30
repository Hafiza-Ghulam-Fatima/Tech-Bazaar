import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaBox, FaShoppingCart, FaChartBar, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import AdminDashboard from './Dashboard';
import UserManagement from './UserManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import AddProduct from './AddProduct';
import ManageCategories from './Categories';

const AdminPage = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { path: '/admin', icon: <FaTachometerAlt />, label: 'Dashboard', component: AdminDashboard },
    { path: '/admin/users', icon: <FaUsers />, label: 'User Management', component: UserManagement },
    { path: '/admin/products', icon: <FaBox />, label: 'Product Management', component: ProductManagement },
    { path: '/admin/orders', icon: <FaShoppingCart />, label: 'Order Management', component: OrderManagement },
    { path: '/admin/categories', icon: <FaCog />, label: 'Manage Categories', component: ManageCategories },
    { path: '/admin/products/new', icon: <FaBox />, label: 'Add New Product', component: AddProduct },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="admin-page">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>TechBazaar Admin</h2>
          <button onClick={toggleSidebar} className="sidebar-toggle"><FaTimes /></button>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map(item => (
              <li key={item.path}>
                <Link to={item.path} className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}>
                  {item.icon} <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt /><span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <button onClick={toggleSidebar} className="menu-toggle"><FaBars /></button>
          <div className="admin-user">
            <span>Welcome, Admin</span>
          </div>
        </div>
        <div className="admin-content">
          <Routes>
            {menuItems.map(item => (
              <Route key={item.path} path={item.path.replace('/admin', '') || '/'} element={<item.component />} />
            ))}
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default AdminPage;