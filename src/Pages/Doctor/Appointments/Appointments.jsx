import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './Appointments.css';

function Appointments({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    axios.get('http://localhost:5000/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const doctorEmail = res.data.email;
        axios.get(`http://localhost:5000/api/appointments/doctor/${doctorEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            if (!Array.isArray(response.data)) {
              setError('Unexpected response format from server');
              return;
            }
            setAppointments(response.data);
            if (response.data.length === 0) {
              setError('No appointments found for this doctor.');
            }
          })
          .catch(err => {
            console.error('Failed to load appointments:', err);
            setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
          });
      })
      .catch(err => {
        console.error('Failed to get user:', err);
        setError('Not logged in or invalid token: ' + (err.response?.data?.error || err.message));
      });
  }, [token]);

  const handleAppointmentResponse = (appointmentId, status) => {
    axios.post(`http://localhost:5000/api/appointments/${appointmentId}/respond`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(() => {
        setAppointments(prev =>
          prev.map(appt =>
            appt._id === appointmentId ? { ...appt, status } : appt
          )
        );
        setMessage(`Appointment ${status} successfully.`);
      })
      .catch(err => {
        setError('Failed to update appointment status: ' + (err.response?.data?.error || err.message));
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

      await axios.delete(`http://localhost:5000/api/appointments/${appointmentToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedAppointments = appointments.filter((appt) => appt._id !== appointmentToDelete._id);
      setAppointments(updatedAppointments);
      setMessage('Appointment removed successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove appointment.');
    } finally {
      setShowConfirmModal(false);
      setAppointmentToDelete(null);
      setTimeout(() => {
        setMessage('');
        setError('');
      }, 3000);
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
      {appointments.length === 0 && !error ? (
        <p>No appointments booked yet.</p>
      ) : (
        <div className="table-wrapper"> {/* Updated from table-container */}
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
                  <td>{appt.patientName}</td>
                  <td>{appt.disease.charAt(0).toUpperCase() + appt.disease.slice(1)}</td>
                  <td>{appt.patientEmail}</td>
                  <td>{appt.patientPhone}</td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
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