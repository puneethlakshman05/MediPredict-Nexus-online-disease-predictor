import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminHome() {
  const navigate = useNavigate();

  // State to manage hover effects for buttons
  const [isDoctorsHovered, setDoctorsHovered] = useState(false);
  const [isPatientsHovered, setPatientsHovered] = useState(false);

  // Styles object
  const styles = {
    adminHomeContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 15px',
    },
    adminHeading: {
      fontSize: '2rem',
      color: '#4c2c69',
      fontWeight: '600',
      marginBottom: '15px',
    },
    welcomeText: {
      fontSize: '1.1rem',
      color: '#374151',
      marginBottom: '30px',
      fontStyle: 'italic',
    },
    buttonRow: {
      display: 'flex',
      flexWrap: 'wrap',
      marginLeft: '-15px',
      marginRight: '-15px',
      marginTop: '1.5rem',
    },
    buttonCol: {
      flex: '0 0 50%',
      maxWidth: '50%',
      paddingLeft: '15px',
      paddingRight: '15px',
      marginBottom: '1rem',
    },
    manageDoctorsButton: {
      background: isDoctorsHovered
        ? 'linear-gradient(135deg, #2563eb, #3b82f6)' // Darker blue gradient on hover
        : 'linear-gradient(135deg, #3b82f6, #60a5fa)', // Blue gradient
      color: '#fff',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease',
      boxShadow: isDoctorsHovered
        ? '0 4px 12px rgba(0, 0, 0, 0.2)'
        : '0 2px 6px rgba(0, 0, 0, 0.15)',
      fontWeight: '500',
      width: '100%',
      textAlign: 'center',
      transform: isDoctorsHovered ? 'scale(1.05)' : 'scale(1)',
    },
    managePatientsButton: {
      background: isPatientsHovered
        ? 'linear-gradient(135deg, #15803d, #22c55e)' // Darker green gradient on hover
        : 'linear-gradient(135deg, #16a34a, #4ade80)', // Green gradient
      color: '#fff',
      padding: '12px 20px',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background 0.3s ease, transform 0.1s ease, box-shadow 0.3s ease',
      boxShadow: isPatientsHovered
        ? '0 4px 12px rgba(0, 0, 0, 0.2)'
        : '0 2px 6px rgba(0, 0, 0, 0.15)',
      fontWeight: '500',
      width: '100%',
      textAlign: 'center',
      transform: isPatientsHovered ? 'scale(1.05)' : 'scale(1)',
    },
  };

  return (
    <div className="page-container short-content">
      <div style={styles.adminHomeContainer}>
        <h1 style={styles.adminHeading}>Admin Dashboard</h1>
        <p style={styles.welcomeText}>Welcome Mr. Admin, here’s your required information</p>
        <div style={styles.buttonRow}>
          <div style={styles.buttonCol}>
            <button
              style={styles.manageDoctorsButton}
              onMouseEnter={() => setDoctorsHovered(true)}
              onMouseLeave={() => setDoctorsHovered(false)}
              onClick={() => navigate('/admin/doctors')}
            >
              Manage Doctors
            </button>
          </div>
          <div style={styles.buttonCol}>
            <button
              style={styles.managePatientsButton}
              onMouseEnter={() => setPatientsHovered(true)}
              onMouseLeave={() => setPatientsHovered(false)}
              onClick={() => navigate('/admin/patients')}
            >
              Manage Patients
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;