import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';
import logo5 from '../../assets/images/logo5.png';

function Navbar({ user, handleLogout, setShowModal, setModalRole }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = (role) => {
    setModalRole(role);
    setShowModal(true);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogoutClick = () => {
    handleLogout();
    setIsOpen(false);
  };

  return (
    <nav className="navbar animate-nav">
      <div className="navbar-container">
        <a href="/" className="heading">
          <img src={logo5} alt="Medipredict Nexus Logo" className="navbar-logo" />
          <span className="navbar-heading animate-heading">MediPredict Nexus</span>
        </a>
        <div className="navbar-right">
          <button className="navbar-toggle animate-toggle" onClick={toggleMenu}>
            {isOpen ? '×' : '☰'}
          </button>
          <div className={`navbar-links ${isOpen ? 'active' : ''}`}>
            {!user.isLoggedIn ? (
              <>
                <button onClick={() => openModal('admin')} className="navbar-button">
                  <i className="fas fa-user-shield"></i> Admin
                </button>
                <button onClick={() => openModal('doctor')} className="navbar-button">
                  <i className="fas fa-user-md"></i> Doctor
                </button>
                <button onClick={() => openModal('patient')} className="navbar-button">
                  <i className="fas fa-user-injured"></i> Patient
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
                      <i className="fas fa-user-md"></i> Home
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
                  </>
                )}
                <button onClick={handleLogoutClick} className="navbar-button logout-button">
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;