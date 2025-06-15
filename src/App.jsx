import React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Components/Navbar/Navbar';
import Footer from './Components/Footer/Footer';
import LoginRegisterModal from './Components/LoginRegisterModal/LoginRegisterModal';
import Sidebar from './Components/Sidebar/Sidebar';
import ProfileModal from './Components/ProfileModal/ProfileModal';
import Home from './Pages/Home/Home';
import AdminHome from './Pages/Admin/AdminHome/AdminHome';
import DoctorHome from './Pages/Doctor/DoctorHome/DoctorHome';
import PatientHome from './Pages/Patient/PatientHome/PatientHome';
import NotFound from './Pages/NotFound';
import BookAppointmentPage from './Pages/Patient/BookAppointmentPage/BookAppointmentPage';
import PatientAppointments from './Pages/Patient/PatientAppointments/PatientAppointments';
import Appointments from './Pages/Doctor/Appointments/Appointments';
import DoctorsList from './Pages/Admin/DoctorsList/DoctorsList';
import PatientsList from './Pages/Admin/PatientList/PatientList';
import PropTypes from 'prop-types';

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

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

function App() {
  const [user, setUser] = useState({
    isLoggedIn: false,
    role: '',
    email: '',
    id: '',
    token: '',
    name: '',
    profilePhoto: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [modalRole, setModalRole] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
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
          const updatedUser = {
            isLoggedIn: true,
            role: data.role || '',
            email: data.email || '',
            id: data.id || '',
            token: storedUser.token,
            name: data.name || '',
            profilePhoto: data.profilePhoto || ''
          };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
        } else {
          setUser({
            isLoggedIn: false,
            role: '',
            email: '',
            id: '',
            token: '',
            name: '',
            profilePhoto: ''
          });
        }
      });
    }
  }, [fetchUserWithToken]);

  const handleLoginSuccess = async (authData) => {
    if (authData?.token) {
      const userData = await fetchUserWithToken(authData.token);
      if (userData) {
        const updatedUser = {
          isLoggedIn: true,
          role: authData.role || '',
          email: userData.email || '',
          id: userData.id || '',
          token: authData.token,
          name: userData.name || '',
          profilePhoto: userData.profilePhoto || ''
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('token', authData.token);
      }
      setShowModal(false);
      setModalRole('');
      const routes = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
      navigate(routes[authData.role] || '/', { replace: true });
    }
  };

  const handleLogout = () => {
    setUser({
      isLoggedIn: false,
      role: '',
      email: '',
      id: '',
      token: '',
      name: '',
      profilePhoto: ''
    });
    localStorage.removeItem('user');
    setShowModal(false);
    setModalRole('');
    navigate('/');
  };

  const updateUser = (updatedUser) => {
    const newUser = {
      ...user,
      name: updatedUser.name || user.name,
      profilePhoto: updatedUser.profilePhoto || user.profilePhoto
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <ErrorBoundary>
      <div className="app-container">
        <Navbar
          user={user}
          handleLogout={handleLogout}
          setShowModal={setShowModal}
          setModalRole={setModalRole}
          setShowSidebar={setShowSidebar}
          token={user.token}
        />
        {showSidebar && (
          <Sidebar
            setShowModal={setShowModal}
            setModalRole={setModalRole}
            setShowSidebar={setShowSidebar}
          />
        )}
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
        {showModal && modalRole !== 'profile' && (
          <LoginRegisterModal
            role={modalRole}
            onLoginSuccess={handleLoginSuccess}
            onClose={() => {
              setShowModal(false);
              setModalRole('');
            }}
          />
        )}
        {showModal && modalRole === 'profile' && (
          <ProfileModal
            show={showModal}
            onClose={() => {
              setShowModal(false);
              setModalRole('');
            }}
            user={user}
            token={user.token}
            updateUser={updateUser}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;
