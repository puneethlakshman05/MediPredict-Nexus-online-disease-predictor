import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faBell, faRightFromBracket, faCamera, faTrashCan, faXmark, 
  faEnvelope, faCircleUser, faPhone 
} from '@fortawesome/free-solid-svg-icons';
import NotificationModal from '../../Pages/Patient/NotificationModal/NotificationModal.jsx';
import './Navbar.css';
import logo5 from '../../assets/images/logo5.png';

// Debug: Log imports
console.log('Imported NotificationModal:', typeof NotificationModal);
console.log('Imported logo5:', logo5);

function Navbar({ user, handleLogout, setShowModal, setModalRole, setShowSidebar, token, setUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [imageError, setImageError] = useState(false);

  // Debug: Log props and state updates
  useEffect(() => {
    console.log('Navbar props:', { user, token });
    console.log('Profile photo URL:', user.profilePhoto ? `http://localhost:5000${user.profilePhoto}` : 'No photo');
  }, [user, token]);

  const fetchNotifications = useCallback(async () => {
    if (user.isLoggedIn && user.role === 'patient') {
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.email}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        setUnreadNotifications(res.data.filter(notif => !notif.read).length);
      } catch (err) {
        console.error('Failed to load notifications:', err.response?.data || err.message);
      }
    }
  }, [user.isLoggedIn, user.role, user.email, token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setIsOpen(true); // Ensure navbar-links is active when dropdown is opened
    console.log('Profile dropdown toggled, isOpen:', isOpen, 'Dropdown visible:', showProfileDropdown);
  };

  const handleCloseDropdown = (e) => {
    e.stopPropagation();
    setShowProfileDropdown(false);
    setShowConfirmPopup(false);
  };

  const handleProfileUpdate = (e) => {
    e.stopPropagation();
    setShowModal(true);
    setModalRole('profile');
    setShowProfileDropdown(false);
    setShowConfirmPopup(false);
    setIsOpen(false);
    console.log('Profile modal triggered, width:', window.innerWidth, 'Dropdown visible:', showProfileDropdown, 'ShowModal called');
  };

  const handleRemovePhoto = async (e) => {
    e.stopPropagation();
    try {
      const res = await axios.delete('http://localhost:5000/api/remove-profile-photo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile photo removed:', res.data);
      setUser({ ...user, profilePhoto: '', name: res.data.name });
      setImageError(false);
      setShowConfirmPopup(false);
    } catch (err) {
      console.error('Failed to remove profile photo:', err.response?.data || err.message);
      setShowConfirmPopup(false);
    }
  };

  const handleTrashClick = (e) => {
    e.stopPropagation();
    setShowConfirmPopup(true);
  };

  const handleCancelRemove = (e) => {
    e.stopPropagation();
    setShowConfirmPopup(false);
  };

  const openLoginModal = (role) => {
    setModalRole(role);
    setShowModal(true);
    setIsOpen(false);
    setShowConfirmPopup(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setShowProfileDropdown(false);
    setShowConfirmPopup(false);
  };

  const toggleSidebar = () => {
    setShowSidebar(true);
    setIsOpen(false);
    setShowConfirmPopup(false);
  };

  const handleLogoutClick = () => {
    handleLogout();
    setIsOpen(false);
    setShowProfileDropdown(false);
    setShowConfirmPopup(false);
  };

  const handleImageError = () => {
    setImageError(true);
    console.error('Failed to load profile photo');
  };

  const profilePhotoUrl = user.profilePhoto
    ? `http://localhost:5000${user.profilePhoto}?t=${Date.now()}`
    : null;

  return (
    <nav className="navbar animate-nav">
      <div className="navbar-container">
        <a href="/" className="heading">
          <img src={logo5} alt="Medipredict Nexus Logo" className="navbar-logo" />
          <span className="navbar-heading animate-heading">MediPredict Nexus</span>
        </a>
        <div className="navbar-right">
          <button className="navbar-toggle" onClick={toggleMenu}>
            {isOpen ? '×' : '☰'}
          </button>
          <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
            {!user.isLoggedIn ? (
              <>
                <button onClick={() => openLoginModal('doctor')} className="navbar-button">
                  <i className="fas fa-user-md"></i> Doctor
                </button>
                <button onClick={() => openLoginModal('patient')} className="navbar-button">
                  <i className="fas fa-user-injured"></i> Patient
                </button>
                <button onClick={toggleSidebar} className="navbar-button">
                  <b>☰</b>
                </button>
              </>
            ) : (
              <>
                {user.role === 'admin' && (
                  <>
                    <Link to="/admin" className="navbar-link">
                      <i className="fas fa-tachometer-alt"></i> Dashboard
                    </Link>
                    <Link to="/admin/doctors" className="navbar-link">
                      <i className="fas fa-user-md"></i> Doctors
                    </Link>
                    <Link to="/admin/patients" className="navbar-link">
                      <i className="fas fa-user-injured"></i> Patients
                    </Link>
                  </>
                )}
                {user.role === 'doctor' && (
                  <>
                    <Link to="/doctor" className="navbar-link">
                      <i className="fas fa-user-md"></i> Doctor
                    </Link>
                    <Link to="/doctor/appointments" className="navbar-link">
                      <i className="fas fa-calendar-check"></i> Appointments
                    </Link>
                    <Link to="/doctor/patients" className="navbar-link">
                      <i className="fas fa-users"></i> Patients
                    </Link>
                  </>
                )}
                {user.role === 'patient' && (
                  <>
                    <Link to="/patient" className="navbar-link">
                      <i className="fas fa-user-injured"></i> Home
                    </Link>
                    <Link to="/patient/appointments" className="navbar-link">
                      <i className="fas fa-calendar-check"></i> Appointments
                    </Link>
                  </>
                )}
                {user.role === 'patient' && (
                  <div className="notification-icon-container">
                    <FontAwesomeIcon
                      icon={faBell}
                      className="notification-icon"
                      onClick={() => setShowNotificationModal(true)}
                    />
                    {unreadNotifications > 0 && (
                      <span className="notification-dot">{unreadNotifications}</span>
                    )}
                  </div>
                )}
                <div className="profile-holder" onClick={handleProfileClick}>
                  {!imageError && profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="profile-photo"
                      onError={handleImageError}
                    />
                  ) : (
                    <FontAwesomeIcon icon={faCircleUser} className="profile-photo user-icon-placeholder" />
                  )}
                </div>
                {showProfileDropdown && (
                  <div className="profile-dropdown">
                    <FontAwesomeIcon
                      icon={faXmark}
                      className="close-button"
                      onClick={handleCloseDropdown}
                    />
                    <div className="dropdown-profile-container">
                      <div className="dropdown-profile">
                        {!imageError && profilePhotoUrl ? (
                          <img
                            src={profilePhotoUrl}
                            alt="Profile"
                            className="profile-photo"
                            onError={handleImageError}
                          />
                        ) : (
                          <FontAwesomeIcon icon={faCircleUser} className="profile-photo user-icon-placeholder" />
                        )}
                        <FontAwesomeIcon
                          icon={faCamera}
                          className="camera-icon"
                          onClick={handleProfileUpdate}
                          style={{ zIndex: 13000 }} // Ensure clickable
                        />
                        {profilePhotoUrl && (
                          <FontAwesomeIcon
                            icon={faTrashCan}
                            className="trash-icon"
                            onClick={handleTrashClick}
                          />
                        )}
                      </div>
                    </div>
                    {showConfirmPopup && (
                      <div className="confirm-popup">
                        <p className="content">Are you sure you want to remove your profile photo?</p>
                        <div className="confirm-buttons">
                          <button className="confirm-yes" onClick={handleRemovePhoto}>Yes</button>
                          <button className="confirm-no" onClick={handleCancelRemove}>No</button>
                        </div>
                      </div>
                    )}
                    <div className="user-details">
                      <div className="user-detail-item">
                        <FontAwesomeIcon icon={faUser} className="user-detail-icon" />
                        <p className="user-name">{user.name || 'User'}</p>
                      </div>
                      <div className="user-detail-item">
                        <FontAwesomeIcon icon={faEnvelope} className="user-detail-icon" />
                        <p className="user-email">{user.email}</p>
                      </div>
                    </div>
                    <div className="dropdown-links">
                      <a href="mailto:admin@hospital.com" className="dropdown-link">Contact Us</a>
                      <div className="user-detail-item">
                        <FontAwesomeIcon icon={faPhone} className="user-detail-icon" />
                        <a href="tel:+917989736421" className="dropdown-link">+91 7989736421</a>
                      </div>
                      <Link to="/faqs" className="dropdown-link">FAQs</Link>
                      <p className="dropdown-footer">© 2025 MediPredict Nexus. All Rights Reserved.</p>
                    </div>
                    <button onClick={handleLogoutClick} className="navbar-button logout-button">
                      <FontAwesomeIcon icon={faRightFromBracket} /> Logout
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {user.role === 'patient' && (
        <NotificationModal
          notifications={notifications}
          setNotifications={setNotifications}
          show={showNotificationModal}
          onHide={() => setShowNotificationModal(false)}
          token={token}
        />
      )}
    </nav>
  );
}

Navbar.propTypes = {
  user: PropTypes.shape({
    isLoggedIn: PropTypes.bool.isRequired,
    role: PropTypes.oneOf(['', 'patient', 'doctor', 'admin']),
    email: PropTypes.string,
    id: PropTypes.string,
    token: PropTypes.string,
    name: PropTypes.string,
    profilePhoto: PropTypes.string,
  }).isRequired,
  handleLogout: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
  setModalRole: PropTypes.func.isRequired,
  setShowSidebar: PropTypes.func.isRequired,
  token: PropTypes.string.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default Navbar;