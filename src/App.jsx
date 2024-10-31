import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

import AppNavbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import LoginRegisterModal from './Components/LoginRegisterModal/LoginRegisterModal';

import Home from './Pages/Home/Home';
import AdminHome from './Pages/Admin/AdminHome';
import DoctorsList from './Pages/Admin/DoctorsList';
import PatientsList from './Pages/Admin/PatientList';
import DoctorHome from './Pages/Doctor/DoctorHome';
import Appointments from './Pages/Doctor/DoctorAppointments';
import Patients from './Pages/Doctor/DoctorPatients';
import PatientHome from './Pages/Patient/PatientHome';
import NotFound from './Pages/NotFound';

import './App.css';

function App() {
  const [user, setUser] = useState({ isLoggedIn: false, role: null, name: null, id: null });
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage on initial page load or refresh
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.isLoggedIn) {
      setUser(storedUser);
      // Redirect based on role if user is logged in
      if (storedUser.role === 'admin') {
        navigate('/admin');
      } else if (storedUser.role === 'doctor') {
        navigate('/doctor');
      } else if (storedUser.role === 'patient') {
        navigate('/patient');
      }
    }
  }, [navigate]);

  const handleLoginSuccess = (loggedInUser) => {
    const userDetails = {
      isLoggedIn: true,
      role: loggedInUser.role,
      name: loggedInUser.name || null,
      id: loggedInUser.id || null,
    };
    setUser(userDetails);
    localStorage.setItem('user', JSON.stringify(userDetails)); // Save user to localStorage
    setShowModal(false);
    setModalRole(null);

    // Navigate to the appropriate page based on the role
    if (loggedInUser.role === 'admin') {
      navigate('/admin');
    } else if (loggedInUser.role === 'doctor') {
      navigate('/doctor');
    } else if (loggedInUser.role === 'patient') {
      navigate('/patient');
    }
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, role: null, name: null, id: null });
    localStorage.removeItem('user'); // Clear user data from localStorage
    navigate('/'); // Redirect to home page after logout
  };

  return (
    <div>
      <AppNavbar
        user={user}
        handleLogout={handleLogout}
        setShowModal={setShowModal}
        setModalRole={setModalRole}
      />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={user.isLoggedIn && user.role === 'admin' ? <AdminHome /> : <Navigate to="/" replace />} />
        <Route path="/doctor" element={user.isLoggedIn && user.role === 'doctor' ? <DoctorHome handleLogout={handleLogout} /> : <Navigate to="/" replace />} />
        <Route path="/patient" element={user.isLoggedIn && user.role === 'patient' ? <PatientHome handleLogout={handleLogout} /> : <Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Footer />

      {showModal && (
        <LoginRegisterModal role={modalRole} onLoginSuccess={handleLoginSuccess} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default App;
