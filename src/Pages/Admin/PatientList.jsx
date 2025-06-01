import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PatientsList({ token }) {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/patients', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPatients(response.data.patients);
      } catch (err) {
        setError('Failed to fetch patients.');
        setTimeout(() => setError(''), 3000);
      }
    };

    fetchPatients();

    const handlePatientUpdate = (event) => {
      const newPatient = event.detail;
      if (newPatient && newPatient.role === 'patient') {
        setPatients((prevPatients) => [...prevPatients, newPatient]);
      }
    };

    window.addEventListener('patientUpdated', handlePatientUpdate);
    return () => window.removeEventListener('patientUpdated', handlePatientUpdate);
  }, [token]);

  const handleDelete = (patient) => {
    setPatientToDelete(patient);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (!patientToDelete || !patientToDelete._id) {
        setError('Invalid patient selected for deletion.');
        setShowConfirmModal(false);
        setPatientToDelete(null);
        setTimeout(() => setError(''), 3000);
        return;
      }

      await axios.delete(`http://localhost:5000/api/patients/${patientToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedPatients = patients.filter((patient) => patient._id !== patientToDelete._id);
      setPatients(updatedPatients);
      setMessage('Patient removed successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove patient.');
    } finally {
      setShowConfirmModal(false);
      setPatientToDelete(null);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setPatientToDelete(null);
  };

  return (
    <div style={styles.container}>
      {message && <div style={styles.message}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>S.N</th>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Email</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient, index) => (
            <tr key={patient._id}>
              <td style={styles.td}>{index + 1}</td>
              <td style={styles.td}>{patient.name}</td>
              <td style={styles.td}>{patient.email}</td>
              <td style={styles.td}>
                <button style={styles.deleteButton} onClick={() => handleDelete(patient)}>
                  <i style={styles.deleteIcon} className="fas fa-trash-alt"></i> Remove
                </button>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr>
              <td colSpan="4" style={styles.noPatientsMessage}>
                We regret to inform you that there are currently no patients listed or registered in the system.
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
              Do you really want to remove this patient?
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
    backgroundColor: '#fff', // Added for readability
    transition: 'backgroundColor 0.3s ease',
  },
  noPatientsMessage: {
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
  deleteButtonHover: {
    background: '#1e90ff', // Blue on hover
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
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
  yesButtonHover: {
    background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)', // Darker teal to cyan on hover
    transform: 'scale(1.05)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  },
  noButton: {
    backgroundColor: '#6b7280',
    color: '#fff',
    padding: '10px 24px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'backgroundColor 0.3s ease, transform 0.1s ease, boxShadow 0.3s ease',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
};

export default PatientsList;