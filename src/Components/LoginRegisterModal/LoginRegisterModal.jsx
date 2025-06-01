import React, { useState } from 'react';
import axios from 'axios';
import './LoginRegisterModal.css';
import { useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEyeSlash,
  faEnvelope, faLock, faUser, faUserMd,
  faMoon, faSun
} from '@fortawesome/free-solid-svg-icons';

function LoginRegisterModal({ role, onLoginSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerSpecialization, setRegisterSpecialization] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [mode, setMode] = useState('login'); // login, register, forgot, reset

  const navigate = useNavigate();

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!role) {
      setLoginError('Invalid role');
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/login/${role}`, {
        email: loginEmail,
        password: loginPassword,
      });
      setLoginEmail('');
      setLoginPassword('');
      setLoginError('');
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role) {
      setRegisterError('Invalid role');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match!');
      return;
    }
    try {
      // Step 1: Register the user
      const payload = {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      };
      if (role === 'doctor') {
        if (!registerSpecialization) {
          setRegisterError('Specialization is required');
          return;
        }
        payload.specialization = registerSpecialization;
      }
      const registerRes = await axios.post(`http://localhost:5000/register/${role}`, payload);
      const userData = {
        id: registerRes.data.id,
        name: registerName,
        email: registerEmail,
        role: role,
        specialization: role === 'doctor' ? registerSpecialization : undefined,
      };
      const eventName = role === 'doctor' ? 'doctorUpdated' : 'patientUpdated';
      window.dispatchEvent(new CustomEvent(eventName, { detail: userData }));
      
      alert(`${capitalize(role)} registered successfully`);

      // Step 2: Automatically log in the user
      const loginRes = await axios.post(`http://localhost:5000/login/${role}`, {
        email: registerEmail,
        password: registerPassword,
      });

      // Step 3: Call onLoginSuccess to update user state and handle redirection
      onLoginSuccess(loginRes.data);
      onClose();

      // Clear the form fields
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterSpecialization('');
      setRegisterError('');
    } catch (err) {
      if (err.response?.status === 409) {
        setRegisterError('Email already exists');
      } else {
        setRegisterError(err.response?.data?.error || 'Registration failed');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setLoginError('Please enter your email address.');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/forgot-password', {
        email: resetEmail
      });
      setResetToken(res.data.token);
      setMode('reset');
      setLoginError('');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Failed to initiate password reset.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setLoginError('Please enter a new password.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/reset-password', {
        email: resetEmail,
        token: resetToken,
        newPassword
      });
      setMode('login');
      setIsLogin(true);
      setLoginError('');
      alert('Password reset successful. Please login with your new password.');
      setResetEmail('');
      setNewPassword('');
      setResetToken('');
    } catch (err) {
      setLoginError(err.response?.data?.error || 'Password reset failed.');
    }
  };

  const themeClass = darkMode ? 'dark-mode' : '';

  if (!role) return null;

  return (
    <div className={`modal-overlay ${themeClass}`}>
      <div className="login-modal-container">
        <button className="close-btn" onClick={onClose}>×</button>
        <div className="modal-top-bar">
          <div className="top-actions">
            <button
              className="theme-toggle-icon"
              onClick={() => setDarkMode(!darkMode)}
            >
              <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
            </button>
            <h4 className="modal-title-text">
              {mode === 'login' && `Login as ${capitalize(role)}`}
              {mode === 'register' && `Register as ${capitalize(role)}`}
              {mode === 'forgot' && 'Forgot Password'}
              {mode === 'reset' && 'Reset Password'}
            </h4>
          </div>
        </div>
        <div className="modal-body-content">
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="modal-form">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    autoComplete="username"
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={loginPassword}
                    autoComplete="current-password"
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-icon eye-icon icon-click"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                  >
                    <FontAwesomeIcon icon={showLoginPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <div className="button-group">
                <button type="submit" className="custom-btn">Login</button>
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={() => setMode('forgot')}
                >
                  Forgot Password
                </button>
              </div>
              <div className="switch-link">
                Don't have an account?{' '}
                <span className="zoom-on-hover" onClick={() => setMode('register')}>
                  Register
                </span>
              </div>
            </form>
          )}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="modal-form">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faUser} /></span>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                  <input
                    type="email"
                    placeholder="Email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-icon eye-icon icon-click"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                  >
                    <FontAwesomeIcon icon={showRegisterPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-icon eye-icon icon-click"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
              </div>
              {role === 'doctor' && (
                <div className="form-group">
                  <div className="input-group">
                    <span className="input-icon"><FontAwesomeIcon icon={faUserMd} /></span>
                    <input
                      type="text"
                      placeholder="Specialization"
                      value={registerSpecialization}
                      onChange={(e) => setRegisterSpecialization(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}
              {registerError && <div className="error-message">{registerError}</div>}
              <button type="submit" className="custom-btn">Register</button>
              <div className="switch-link">
                Already have an account?{' '}
                <span className="zoom-on-hover" onClick={() => setMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="modal-form">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="custom-btn">Proceed to Reset</button>
              <div className="switch-link">
                Back to{' '}
                <span className="zoom-on-hover" onClick={() => setMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="modal-form">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={resetEmail}
                    readOnly
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              {loginError && <div className="error-message">{loginError}</div>}
              <button type="submit" className="custom-btn">Reset Password</button>
              <div className="switch-link">
                Back to{' '}
                <span className="zoom-on-hover" onClick={() => setMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoginRegisterModal;