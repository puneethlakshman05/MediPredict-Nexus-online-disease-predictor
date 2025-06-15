import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faTimes, faHome, faUserShield, faInfoCircle, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import logo5 from '../../assets/images/logo5.png';
import './Sidebar.css';

function Sidebar({ setShowSidebar, setShowModal, setModalRole }) {
  const navigate = useNavigate();
  const [showPasscodeInput, setShowPasscodeInput] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  const correctPasscode = 'admin123'; // Hardcoded passcode (for learning purposes only)

  const handleAdminLoginClick = () => {
    setShowPasscodeInput(true);
    setError('');
  };

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    if (passcode === correctPasscode) {
      setModalRole('admin');
      setShowModal(true);
      setShowSidebar(false);
      setShowPasscodeInput(false);
      setPasscode('');
    } else {
      setError('Unauthorized access to admin login prohibited.');
    }
  };

  const toggleShowPasscode = () => {
    setShowPasscode((prev) => !prev);
  };

  const handleNavigation = (section) => {
    navigate('/');
    setShowSidebar(false);
    if (section !== 'home') {
      setTimeout(() => {
        const element = document.getElementById('footer');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        } else {
          console.warn('Footer element not found. Ensure <Footer /> has id="footer".');
        }
      }, 100);
    }
  };

  return (
    <div className="sidebar-overlay">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src={logo5} alt="MediPredict Nexus Logo" className="sidebar-logo-img" />
            <span className="sidebar-logo-text">MediPredict Nexus</span>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setShowSidebar(false)}
            aria-label="Close sidebar"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <hr className="sidebar-divider" />
        <ul className="sidebar-menu">
          <li>
            <button
              onClick={() => handleNavigation('home')}
              className="sidebar-menu-btn"
              aria-label="Navigate to home"
            >
              <FontAwesomeIcon icon={faHome} className="menu-icon" /> Home
            </button>
          </li>
          <li>
            {!showPasscodeInput ? (
              <button
                onClick={handleAdminLoginClick}
                className="sidebar-menu-btn"
                aria-label="Open admin login passcode"
              >
                <FontAwesomeIcon icon={faUserShield} className="menu-icon" /> Admin Login
              </button>
            ) : (
              <form onSubmit={handlePasscodeSubmit} className="passcode-form">
                <div className="passcode-input-wrapper">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter admin passcode"
                    className="passcode-input"
                    required
                    aria-label="Admin passcode"
                  />
                  <button
                    type="button"
                    onClick={toggleShowPasscode}
                    className="passcode-toggle-btn"
                    aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
                  >
                    <FontAwesomeIcon icon={showPasscode ? faEyeSlash : faEye} />
                  </button>
                </div>
                {error && <div className="passcode-error">{error}</div>}
                <button type="submit" className="passcode-submit-btn">
                  Submit
                </button>
              </form>
            )}
          </li>
          <li>
            <button
              onClick={() => handleNavigation('about')}
              className="sidebar-menu-btn"
              aria-label="Navigate to about section"
            >
              <FontAwesomeIcon icon={faInfoCircle} className="menu-icon" /> About Us
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigation('contact')}
              className="sidebar-menu-btn"
              aria-label="Navigate to contact section"
            >
              <FontAwesomeIcon icon={faEnvelope} className="menu-icon" /> Contact Us
            </button>
          </li>
        </ul>
        <div className="sidebar-footer">
          <p className="sidebar-footer-text">© 2025 MediPredict Nexus</p>
        </div>
      </div>
    </div>
  );
}

Sidebar.propTypes = {
  setShowSidebar: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
  setModalRole: PropTypes.func.isRequired,
};

export default Sidebar;