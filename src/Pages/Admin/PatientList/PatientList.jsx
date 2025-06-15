import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import './PatientList.css';

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
      } catch {
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
    <div className="patients-list-container">
      {message && <div className="patients-list-message">{message}</div>}
      {error && <div className="patients-list-error">{error}</div>}
      <table className="patients-list-table">
        <thead>
          <tr>
            <th className="patients-list-th">S.N</th>
            <th className="patients-list-th">Name</th>
            <th className="patients-list-th">Email</th>
            <th className="patients-list-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient, index) => (
            <tr key={patient._id}>
              <td className="patients-list-td">{index + 1}</td>
              <td className="patients-list-td">{patient.name}</td>
              <td className="patients-list-td">{patient.email}</td>
              <td className="patients-list-td">
                <button className="patients-list-delete-button" onClick={() => handleDelete(patient)}>
                  <i className="fas fa-trash-alt patients-list-delete-icon"></i> Remove
                </button>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr>
              <td colSpan="4" className="patients-list-no-patients-message">
                We regret to inform you that there are currently no patients listed or registered in the system.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="patients-list-modal-overlay">
          <div className="patients-list-confirm-modal">
            <h3 className="patients-list-confirm-title">Confirm Removal</h3>
            <p className="patients-list-confirm-text">
              Do you really want to remove this patient?
            </p>
            <div className="patients-list-confirm-buttons">
              <button className="patients-list-yes-button" onClick={confirmDelete}>Yes</button>
              <button className="patients-list-no-button" onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

PatientsList.propTypes = {
  token: PropTypes.string.isRequired,
};

export default PatientsList;