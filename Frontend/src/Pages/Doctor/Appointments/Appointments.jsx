import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './Appointments.css';
import API_BASE_URL from "../../../config";

function Appointments({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No authentication token provided');
      setLoading(false);
      return;
    }

    setLoading(true);
    axios.get(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const doctorEmail = res.data.email;
        console.log('Doctor email:', doctorEmail);

        axios.get(`${API_BASE_URL}/api/appointments/doctor/${doctorEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            console.log('Appointments fetched:', response.data);
            if (!Array.isArray(response.data)) {
              setError('Unexpected response format from server');
              setAppointments([]);
            } else {
              setAppointments(response.data);
              setError(''); // clear previous errors
            }
          })
          .catch(err => {
            console.error('Failed to load appointments:', err);
            setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
          })
          .finally(() => setLoading(false));
      })
      .catch(err => {
        console.error('Failed to get user:', err);
        setError('Not logged in or invalid token: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      });
  }, [token]);

  const handleAppointmentResponse = (appointmentId, status) => {
    axios.post(`${API_BASE_URL}/api/appointments/${appointmentId}/respond`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setAppointments(prev =>
          prev.map(appt =>
            appt._id === appointmentId ? { ...appt, status } : appt
          )
        );
        setMessage(`Appointment ${status} successfully.`);
        setTimeout(() => setMessage(''), 3000);
      })
      .catch(err => {
        setError('Failed to update appointment status: ' + (err.response?.data?.error || err.message));
        setTimeout(() => setError(''), 3000);
        console.error(err);
      });
  };

  const handleDelete = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (!appointmentToDelete || !appointmentToDelete._id) {
        setError('Invalid appointment selected for deletion.');
        setShowConfirmModal(false);
        setAppointmentToDelete(null);
        setTimeout(() => setError(''), 3000);
        return;
      }

      await axios.delete(`${API_BASE_URL}/api/appointments/${appointmentToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppointments(prev => prev.filter(appt => appt._id !== appointmentToDelete._id));
      setMessage('Appointment removed successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove appointment.');
      setTimeout(() => setError(''), 3000);
    } finally {
      setShowConfirmModal(false);
      setAppointmentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setAppointmentToDelete(null);
  };

  return (
    <div className="appointments-container">
      <h1>Your Appointments</h1>
      {message && <div className="message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      {loading ? (
        <p>Loading appointments...</p>
      ) : appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Patient Name</th>
                <th>Disease</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, index) => (
                <tr key={appt._id}>
                  <td>{index + 1}</td>
                  <td>{appt.patientName || 'N/A'}</td>
                  <td>{appt.disease ? appt.disease.charAt(0).toUpperCase() + appt.disease.slice(1) : 'N/A'}</td>
                  <td>{appt.patientEmail || 'N/A'}</td>
                  <td>{appt.patientPhone || 'N/A'}</td>
                  <td>{appt.date || 'N/A'}</td>
                  <td>{appt.time || 'N/A'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{appt.status || 'Pending'}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="button approve-button"
                        disabled={appt.status === 'approved'}
                        onClick={() => handleAppointmentResponse(appt._id, 'approved')}
                      >
                        Approve
                      </button>
                      <button
                        className="button reject-button"
                        disabled={appt.status === 'rejected'}
                        onClick={() => handleAppointmentResponse(appt._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      className="delete-button"
                      onClick={() => handleDelete(appt)}
                    >
                      <i className="fas fa-trash-alt delete-icon"></i> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3 className="confirm-title">Confirm Removal</h3>
            <p className="confirm-text">
              Do you really want to remove this appointment?
            </p>
            <div className="confirm-buttons">
              <button className="yes-button" onClick={confirmDelete}>Yes</button>
              <button className="no-button" onClick={cancelDelete}>No</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Appointments.propTypes = {
  token: PropTypes.string.isRequired,
};

export default Appointments;
