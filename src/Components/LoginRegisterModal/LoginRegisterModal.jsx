import { useState, useEffect } from 'react';
import axios from 'axios';
import './LoginRegisterModal.css';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye, faEyeSlash,
  faEnvelope, faLock, faUser, faUserMd,
  faMoon, faSun, faKey
} from '@fortawesome/free-solid-svg-icons';

function LoginRegisterModal({ role, onLoginSuccess, onClose }) {
  const [darkMode, setDarkMode] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerSpecialization, setRegisterSpecialization] = useState('');
  const [registerMessage, setRegisterMessage] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [mode, setMode] = useState('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [otpExpired, setOtpExpired] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    if (mode !== 'reset-otp' || otpExpired) return;
    if (timeLeft <= 0) {
      setOtpExpired(true);
      setLoginMessage('OTP has expired. Please resend OTP.');
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, timeLeft, otpExpired]);

  const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!role) {
      setLoginMessage('Invalid role');
      return;
    }
    try {
      const res = await axios.post(`http://localhost:5000/login/${role}`, {
        email: loginEmail,
        password: loginPassword,
      });
      setLoginEmail('');
      setLoginPassword('');
      setLoginMessage('');
      onLoginSuccess(res.data);
      onClose();
    } catch (err) {
      setLoginMessage(err.response?.data?.error || 'Invalid credentials');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!role) {
      setRegisterMessage('Invalid role');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setRegisterMessage('Passwords do not match');
      return;
    }
    try {
      const payload = {
        name: registerName,
        email: registerEmail,
        password: registerPassword,
      };
      if (role === 'doctor') {
        if (!registerSpecialization) {
          setRegisterMessage('Specialization is required');
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
      const loginRes = await axios.post(`http://localhost:5000/login/${role}`, {
        email: registerEmail,
        password: registerPassword,
      });
      onLoginSuccess(loginRes.data);
      onClose();
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
      setRegisterSpecialization('');
      setRegisterMessage('');
    } catch (err) {
      if (err.response?.status === 409) {
        setRegisterMessage('Email already exists');
      } else {
        setRegisterMessage(err.response?.data?.error || 'Registration failed');
      }
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setLoginMessage('Please enter your email address');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await axios.post('http://localhost:5000/api/forgot-password', {
        email: resetEmail
      });
      setMode('reset-otp'); // Updated to new sub-mode
      setLoginMessage('');
      setTimeLeft(20);
      setOtpExpired(false);
      alert(response.data.message);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to send OTP. Please try again';
      setLoginMessage(errorMessage);
      console.error('Forgot Password Error:', err.response?.data || err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    await handleForgotPassword(e);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setLoginMessage('Please enter the OTP');
      return;
    }
    if (isSubmitting || otpExpired) return;
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/verify-otp', {
        email: resetEmail,
        otp,
      });
      setMode('reset-password'); // Proceed to password reset step
      setLoginMessage('');
    } catch (err) {
      setLoginMessage(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setLoginMessage('Please enter a new password');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/reset-password', {
        email: resetEmail,
        otp,
        newPassword
      });
      setMode('login');
      setLoginMessage('');
      alert('Password reset successful. Please login with your new password');
      setResetEmail('');
      setOtp('');
      setNewPassword('');
      setTimeLeft(20);
      setOtpExpired(false);
    } catch (err) {
      setLoginMessage(err.response?.data?.error || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
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
              {mode === 'reset-otp' && 'Verify OTP'}
              {mode === 'reset-password' && 'Reset Password'}
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
              {loginMessage && <div className="message">{loginMessage}</div>}
              <div className="button-group">
                <button type="submit" className="custom-btn primary-btn">Login</button>
                <button
                  type="button"
                  className="custom-btn secondary-btn"
                  onClick={() => setMode('forgot')}
                >
                  Forgot Password
                </button>
              </div>
              <div className="switch-link">
                Do not have an account?{' '}
                <span className="link-text" onClick={() => setMode('register')}>
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
              {registerMessage && <div className="message">{registerMessage}</div>}
              <div className="button-group">
                <button type="submit" className="custom-btn primary-btn">Register</button>
              </div>
              <div className="switch-link">
                Already have an account?{' '}
                <span className="link-text" onClick={() => setMode('login')}>
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
              {loginMessage && <div className="message">{loginMessage}</div>}
              <div className="button-group">
                <button type="submit" className="custom-btn primary-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
              <div className="switch-link">
                Back to{' '}
                <span className="link-text" onClick={() => setMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
          {mode === 'reset-otp' && (
            <form onSubmit={handleVerifyOtp} className="modal-form">
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
                  <span className="input-icon"><FontAwesomeIcon icon={faKey} /></span>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="otp-input"
                  />
                </div>
              </div>
              <div className="timer">
                {otpExpired ? 'OTP Expired' : `OTP expires in ${timeLeft} seconds`}
              </div>
              {loginMessage && <div className="message">{loginMessage}</div>}
              <div className="button-group">
                <button
                  type="submit"
                  className="custom-btn primary-btn"
                  disabled={isSubmitting || otpExpired}
                >
                  {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                </button>
                {otpExpired && (
                  <button
                    type="button"
                    className="custom-btn secondary-btn"
                    onClick={handleResendOtp}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Resend OTP'}
                  </button>
                )}
              </div>
              <div className="switch-link">
                Back to{' '}
                <span className="link-text" onClick={() => setMode('login')}>
                  Login
                </span>
              </div>
            </form>
          )}
          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="modal-form">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <span
                    className="input-icon eye-icon icon-click"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <FontAwesomeIcon icon={showNewPassword ? faEyeSlash : faEye} />
                  </span>
                </div>
              </div>
              {loginMessage && <div className="message">{loginMessage}</div>}
              <div className="button-group">
                <button
                  type="submit"
                  className="custom-btn primary-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
              <div className="switch-link">
                Back to{' '}
                <span className="link-text" onClick={() => setMode('login')}>
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

LoginRegisterModal.propTypes = {
  role: PropTypes.oneOf(['admin', 'doctor', 'patient']).isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default LoginRegisterModal;