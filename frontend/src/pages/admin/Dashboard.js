import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { FaUsers, FaBox, FaShoppingCart, FaRupeeSign, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats();
      setStats(response.stats);
      setRecentOrders(response.recentOrders || []);
      setRecentUsers(response.recentUsers || []);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `Rs. ${new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'shipped': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">{error}</div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="stat-label">Total Users</div>
              <div className="stat-value">{stats.totalUsers || 0}</div>
              <div className="stat-change positive">
                <FaArrowUp /> 12% from last month
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(37, 99, 235, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-color)',
              fontSize: '1.5rem'
            }}>
              <FaUsers />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="stat-label">Total Products</div>
              <div className="stat-value">{stats.totalProducts || 0}</div>
              <div className="stat-change positive">
                <FaArrowUp /> 5% from last month
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--success-color)',
              fontSize: '1.5rem'
            }}>
              <FaBox />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="stat-label">Total Orders</div>
              <div className="stat-value">{stats.totalOrders || 0}</div>
              <div className="stat-change positive">
                <FaArrowUp /> 8% from last month
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--warning-color)',
              fontSize: '1.5rem'
            }}>
              <FaShoppingCart />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="stat-label">Total Revenue</div>
              <div className="stat-value">{formatCurrency(stats.totalRevenue || 0)}</div>
              <div className="stat-change positive">
                <FaArrowUp /> 15% from last month
              </div>
            </div>
            <div style={{
              width: '50px',
              height: '50px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--danger-color)',
              fontSize: '1.5rem'
            }}>
              <FaRupeeSign />
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-wrap" style={{ gap: '2rem', marginBottom: '2rem' }}>
        {/* Recent Orders */}
        <div style={{ flex: '1 0 300px' }}>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Recent Orders</h3>
              <Link to="/admin/orders" className="btn btn-sm btn-outline">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No recent orders</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td>{order.order_number}</td>
                        <td>{order.email}</td>
                        <td>{formatCurrency(order.total_amount)}</td>
                        <td>
                          <span className={`badge badge-${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Recent Users */}
        <div style={{ flex: '1 0 300px' }}>
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Recent Users</h3>
              <Link to="/admin/users" className="btn btn-sm btn-outline">
                View All
              </Link>
            </div>
            <div className="card-body p-0">
              {recentUsers.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted">No recent users</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.first_name} {user.last_name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge badge-${user.role === 'admin' ? 'primary' : 'secondary'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${user.is_blocked ? 'danger' : 'success'}`}>
                            {user.is_blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="mb-0">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
            <Link to="/admin/products/new" className="btn btn-primary">
              Add New Product
            </Link>
            <Link to="/admin/categories" className="btn btn-outline">
              Manage Categories
            </Link>
            <Link to="/admin/users" className="btn btn-outline">
              Manage Users
            </Link>
            <Link to="/admin/orders" className="btn btn-outline">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;