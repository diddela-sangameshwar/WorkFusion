import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiUser, FiMail, FiLock, FiZap, FiBriefcase } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', department: 'Engineering', role: 'employee',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(formData);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg">
        <div className="bg-orb orb-1" />
        <div className="bg-orb orb-2" />
        <div className="bg-orb orb-3" />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo"><FiZap /></div>
            <h1>Create Account</h1>
            <p>Join WorkFusion today</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="reg-name">Full Name</label>
              <div className="input-wrapper">
                <FiUser className="input-icon" />
                <input id="reg-name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter your name" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-email">Email</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input id="reg-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-wrapper">
                <FiLock className="input-icon" />
                <input id="reg-password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" required minLength={6} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reg-department">Department</label>
                <div className="input-wrapper">
                  <FiBriefcase className="input-icon" />
                  <select id="reg-department" name="department" value={formData.department} onChange={handleChange}>
                    <option>Engineering</option>
                    <option>Marketing</option>
                    <option>Design</option>
                    <option>Human Resources</option>
                    <option>Management</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="reg-role">Role</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <select id="reg-role" name="role" value={formData.role} onChange={handleChange}>
                    <option value="employee">Employee</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="btn-spinner" /> : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
