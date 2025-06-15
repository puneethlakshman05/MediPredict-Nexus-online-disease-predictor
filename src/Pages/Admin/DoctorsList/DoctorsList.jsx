import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import './DoctorsList.css';

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
      } catch {
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
    <div className="doctors-list-container">
      <h1 className="doctors-list-heading">Manage Doctors</h1>

      {message && <div className="doctors-list-message">{message}</div>}
      {error && <div className="doctors-list-error">{error}</div>}
      <table className="doctors-list-table">
        <thead>
          <tr>
            <th className="doctors-list-th">#</th>
            <th className="doctors-list-th">Name</th>
            <th className="doctors-list-th">Email</th>
            <th className="doctors-list-th">Specialization</th>
            <th className="doctors-list-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor, index) => (
            <tr key={doctor._id}>
              <td className="doctors-list-td">{index + 1}</td>
              <td className="doctors-list-td">{doctor.name}</td>
              <td className="doctors-list-td">{doctor.email}</td>
              <td className="doctors-list-td">{doctor.specialization}</td>
              <td className="doctors-list-td">
                <button className="doctors-list-delete-button" onClick={() => handleDelete(doctor)}>
                  <i className="fas fa-trash-alt doctors-list-delete-icon"></i> Remove
                </button>
              </td>
            </tr>
          ))}
          {doctors.length === 0 && (
            <tr>
              <td colSpan="5" className="doctors-list-no-doctors-message">
                We regret to inform you that there are currently no doctors listed or registered in the system.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="doctors-list-modal-overlay">
          <div className="doctors-list-confirm-modal">
            <h3 className="doctors-list-confirm-title">Confirm Removal</h3>
            <p className="doctors-list-confirm-text">
              Do you really want to remove this doctor?
            </p>
            <div className="doctors-list-confirm-buttons">
              <button className="doctors-list-yes-button" onClick={confirmDelete}>Yes</button>
              <button className="doctors-list-no-button" onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

DoctorsList.propTypes = {
  token: PropTypes.string.isRequired,
};

export default DoctorsList;