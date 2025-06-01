import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import LoginRegisterModal from './Components/LoginRegisterModal/LoginRegisterModal';
import Home from './Pages/Home/Home';
import AdminHome from './Pages/Admin/AdminHome';
import DoctorHome from './Pages/Doctor/DoctorHome/DoctorHome';
import PatientHome from './Pages/Patient/PatientHome/PatientHome';
import NotFound from './Pages/NotFound';
import BookAppointmentPage from './Pages/Patient/BookAppointmentPage/BookAppointmentPage';
import PatientAppointments from './Pages/Patient/PatientAppointments/PatientAppointments';
import Appointments from './Pages/Doctor/Appointments/Appointments';
import DoctorsList from './Pages/Admin/DoctorsList';
import PatientsList from './Pages/Admin/PatientList';

class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }
    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState({ isLoggedIn: false, role: '', email: '', id: '', token: '' });
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState('');
  const navigate = useNavigate();

  const fetchUserWithToken = useCallback(async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.headers['content-type']?.includes('application/json')) {
        throw new Error('Non-JSON response');
      }
      return res.data;
    } catch (err) {
      console.error('Fetch user error:', err.message);
      localStorage.removeItem('user');
      return null;
    }
  }, []);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser?.token) {
      fetchUserWithToken(storedUser.token).then(data => {
        if (data) {
          setUser({ ...data, isLoggedIn: true, token: storedUser.token });
          localStorage.setItem('user', JSON.stringify({ ...data, token: storedUser.token }));
        } else {
          setUser({ isLoggedIn: false, role: '', email: '', id: '', token: '' });
        }
      });
    }
  }, [fetchUserWithToken]);

  useEffect(() => {
    console.log('Modal state updated:', { showModal, modalRole });
  }, [showModal, modalRole]);

  const handleLoginSuccess = async (authData) => {
    if (authData?.token) {
      const userData = await fetchUserWithToken(authData.token);
      if (userData) {
        setUser({ ...userData, isLoggedIn: true, token: authData.token });
        localStorage.setItem('user', JSON.stringify({ ...userData, token: authData.token }));
      }
      setShowModal(false);
      setModalRole('');
      const routes = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
      navigate(routes[authData.role] || '/', { replace: true });
    }
  };

  const handleLogout = () => {
    setUser({ isLoggedIn: false, role: '', email: '', id: '', token: '' });
    localStorage.removeItem('user');
    setShowModal(false);
    setModalRole('');
    navigate('/');
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Navbar
          user={user}
          handleLogout={handleLogout}
          setShowModal={setShowModal}
          setModalRole={setModalRole}
        />
        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/admin"
              element={user.isLoggedIn && user.role === 'admin' ? <AdminHome /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/doctors"
              element={user.isLoggedIn && user.role === 'admin' ? <DoctorsList token={user.token} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/admin/patients"
              element={user.isLoggedIn && user.role === 'admin' ? <PatientsList token={user.token} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/doctor"
              element={user.isLoggedIn && user.role === 'doctor' ? <DoctorHome token={user.token} email={user.email} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/doctor/appointments"
              element={user.isLoggedIn && user.role === 'doctor' ? <Appointments token={user.token} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/patient"
              element={user.isLoggedIn && user.role === 'patient' ? <PatientHome token={user.token} email={user.email} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/patient/appointments"
              element={user.isLoggedIn && user.role === 'patient' ? <PatientAppointments token={user.token} /> : <Navigate to="/" replace />}
            />
            <Route
              path="/patient/book-appointment"
              element={user.isLoggedIn && user.role === 'patient' ? <BookAppointmentPage token={user.token} /> : <Navigate to="/" replace />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <Footer />
        {showModal && (
          <LoginRegisterModal
            role={modalRole}
            onLoginSuccess={handleLoginSuccess}
            onClose={() => {
              setShowModal(false);
              setModalRole('');
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;