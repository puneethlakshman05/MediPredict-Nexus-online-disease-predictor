import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './Appointments.css';

function Appointments({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);

  useEffect(() => {
    console.log('Appointments component rendered, token:', token);
    if (!token) {
      setError('No authentication token provided');
      return;
    }

    console.log('Fetching user with token:', token);
    axios.get('http://localhost:5000/api/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUser(res.data);
        const doctorId = res.data.id;
        console.log('Doctor ID:', doctorId);
        axios.get(`http://localhost:5000/api/appointments/doctor/${doctorId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
          .then(response => {
            console.log('Appointments data:', response.data);
            setAppointments(response.data);
          })
          .catch(err => {
            console.error('Failed to load appointments:', err);
            setError('Failed to load appointments.');
          });
      })
      .catch(err => {
        console.error('Failed to get user:', err);
        setError('Not logged in or invalid token');
      });
  }, [token]);

  const handleAppointmentResponse = (appointmentId, status, patientEmail, doctorName) => {
    axios.post(`http://localhost:5000/api/appointments/${appointmentId}/respond`, { status }, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(response => {
        setAppointments(prev =>
          prev.map(appt =>
            appt._id === appointmentId ? { ...appt, status } : appt
          )
        );
      })
      .catch(err => {
        setError('Failed to update appointment status.');
        console.error(err);
      });
  };

  const handleDelete = (appointment) => {
    setPatientToDelete(appointment);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    try {
      if (!patientToDelete || !patientToDelete._id) {
        setError('Invalid appointment selected for deletion.');
        setShowConfirmModal(false);
        setPatientToDelete(null);
        setTimeout(() => setError(''), 3000);
        return;
      }

      await axios.delete(`http://localhost:5000/api/appointments/${patientToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedAppointments = appointments.filter((appt) => appt._id !== patientToDelete._id);
      setAppointments(updatedAppointments);
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
    <div className="appointments-container">
      <h1>Your Appointments</h1>
      {message && <div className="message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
      {appointments.length === 0 && !error ? (
        <p>No appointments booked yet.</p>
      ) : (
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
                      onClick={() => handleAppointmentResponse(appt._id, 'approved', appt.patientEmail, appt.doctorName)}
                    >
                      Approve
                    </button>
                    <button
                      className="button reject-button"
                      disabled={appt.status === 'rejected'}
                      onClick={() => handleAppointmentResponse(appt._id, 'rejected', appt.patientEmail, appt.doctorName)}
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
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="confirm-modal">
            <h3 className="confirm-title">Confirm Removal</h3>
            <p className="confirm-text">
              Do you really want to remove this patient?
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

export default Appointments;