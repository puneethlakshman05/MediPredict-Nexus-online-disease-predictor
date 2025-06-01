import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DoctorsList({ token }) {
  const [doctors, setDoctors] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/doctors', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDoctors(response.data.doctors);
      } catch (err) {
        setError('Failed to fetch doctors.');
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchDoctors();

    const handleDoctorUpdate = (event) => {
      const newDoctor = event.detail;
      if (newDoctor && newDoctor.role === 'doctor') {
        setDoctors((prevDoctors) => [...prevDoctors, newDoctor]);
      }
    };

    window.addEventListener('doctorUpdated', handleDoctorUpdate);
    return () => window.removeEventListener('doctorUpdated', handleDoctorUpdate);
  }, [token]);

  const handleDelete = (doctor) => {
    setDoctorToDelete(doctor);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (!doctorToDelete || !doctorToDelete._id) {
        setError('Invalid doctor selected for deletion.');
        setShowConfirmModal(false);
        setDoctorToDelete(null);
        setTimeout(() => setError(''), 3000);
        return;
      }

      await axios.delete(`http://localhost:5000/api/doctors/${doctorToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedDoctors = doctors.filter((doctor) => doctor._id !== doctorToDelete._id);
      setDoctors(updatedDoctors);
      setMessage('Doctor removed successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove doctor.');
    } finally {
      setShowConfirmModal(false);
      setDoctorToDelete(null);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setDoctorToDelete(null);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Manage Doctors</h1>

      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Specialization</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor, index) => (
            <tr key={doctor._id}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{doctor.name}</td>
              <td style={styles.td}>{doctor.email}</td>
              <td style={styles.td}>{doctor.specialization}</td>
              <td style={styles.td}>
                <button style={styles.deleteButton} onClick={() => handleDelete(doctor)}>
                  <i style={styles.deleteIcon} className="fas fa-trash-alt"></i> Remove
                </button>
              </td>
            </tr>
          ))}
          {doctors.length === 0 && (
            <tr>
              <td colSpan="5" style={styles.noDoctorsMessage}>
                We regret to inform you that there are currently no doctors listed or registered in the system.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmModal}>
            <h3 style={styles.confirmTitle}>Confirm Removal</h3>
            <p style={styles.confirmText}>
              Do you really want to remove this doctor?
            </p>
            <div style={styles.confirmButtons}>
              <button style={styles.yesButton} onClick={confirmDelete}>Yes</button>
              <button style={styles.noButton} onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 0',
  },
  heading: {
    fontSize: '1.8rem',
    color: '#fff',
    backgroundColor: '#4c2c69',
    padding: '10px 20px',
    borderRadius: '8px 8px 0 0',
    margin: '-20px -20px 20px -20px',
    fontWeight: '600',
  },
  note: {
    fontSize: '1rem',
    color: '#374151',
    marginBottom: '15px',
    fontStyle: 'italic',
  },
  message: {
    backgroundColor: '#e2e8f0',
    color: '#4c2c69',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '0.95rem',
    width: '100%',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#c53030',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px',
    textAlign: 'center',
    fontSize: '0.95rem',
    width: '100%',
  },
  table: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  th: {
    backgroundColor: '#4c2c69',
    color: '#fff',
    padding: '14px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #d1d5db',
  },
  td: {
    padding: '14px',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    backgroundColor: '#fff', // Added to ensure readability
    transition: 'background-color 0.3s ease',
  },
  noDoctorsMessage: {
    padding: '20px',
    textAlign: 'center',
    color: '#4c2c69',
    fontSize: '1.2rem',
    fontWeight: '500',
    borderBottom: 'none', // Remove border for the message row
  },
  deleteButton: {
    background: 'linear-gradient(135deg, #1a5e2e, #2e8b57)', // Dark green gradient
    color: '#fff',
    padding: '8px 16px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.3s ease, transform 0.1s ease, boxShadow 0.3s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '500',
  },
  deleteIcon: {
    fontSize: '0.9rem',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '25px',
    width: '100%',
    maxWidth: '350px',
    textAlign: 'center',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    animation: 'fadeIn 0.3s ease',
  },
  confirmTitle: {
    fontSize: '1.4rem',
    color: '#4c2c69',
    marginBottom: '15px',
    fontWeight: '600',
  },
  confirmText: {
    fontSize: '1rem',
    color: '#374151',
    marginBottom: '20px',
  },
  confirmButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
  },
  yesButton: {
    background: 'linear-gradient(135deg, #2dd4bf, #22d3ee)', // Teal to cyan gradient
    color: '#fff',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.3s ease, transform 0.1s ease, boxShadow 0.3s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    fontWeight: '500',
  },
  noButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'backgroundColor 0.3s ease, transform 0.1s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default DoctorsList;