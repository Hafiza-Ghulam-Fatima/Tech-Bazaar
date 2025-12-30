import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaPhone, FaSave } from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const result = await updateProfile(formData);
    
    if (result.success) {
      setSuccess('Profile updated successfully!');
    } else {
      setErrors({ general: result.message });
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="container">
      <div className="d-flex justify-content-center">
        <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
          <div className="card-header">
            <h2 className="text-center">My Profile</h2>
          </div>
          
          <div className="card-body">
            {success && (
              <div className="alert alert-success">{success}</div>
            )}
            
            {errors.general && (
              <div className="alert alert-danger">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="d-flex gap-2 mb-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    <FaUser className="mr-1" /> First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    className="form-control"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">
                    <FaUser className="mr-1" /> Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    className="form-control"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">
                  <FaEnvelope className="mr-1" /> Email Address
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email}
                  readOnly
                  disabled
                />
                <small className="text-muted">Email cannot be changed</small>
              </div>

              <div className="form-group mb-3">
                <label className="form-label">
                  <FaPhone className="mr-1" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
              >
                <FaSave /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;