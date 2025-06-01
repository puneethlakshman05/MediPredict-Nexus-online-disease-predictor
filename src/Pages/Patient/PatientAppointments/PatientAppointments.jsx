import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import './PatientAppointments.css';

function PatientAppointments({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role === 'patient') {
      const patientEmail = storedUser.email;
      axios.get(`http://localhost:5000/api/appointments/patient/${patientEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => setAppointments(res.data))
        .catch(() => setError('Failed to load appointments'));
      axios.get(`http://localhost:5000/api/notifications/${patientEmail}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          setNotifications(res.data);
        })
        .catch(() => setError('Failed to load notifications'));
    } else {
      setError('No logged-in patient found.');
    }
  }, [token]);

  const markAsRead = (notificationId) => {
    axios.patch(
      `http://localhost:5000/api/notifications/${notificationId}`,
      { read: true },
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then(() => {
        setNotifications(prev =>
          prev.map(notif =>
            notif._id === notificationId ? { ...notif, read: true } : notif
          )
        );
      })
      .catch(err => console.error('Failed to mark notification as read:', err));
  };

  return (
    <div className="container">
      <h1>Your Appointments</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <button
        className="Button Button-Primary notification-button"
        onClick={() => setShowNotifications(true)}
      >
        View Notifications
      </button>
      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        <div className="table-container">
          <h2>Appointments Status</h2>
          <table>
            <thead>
              <tr>
                <th>S.No.</th>
                <th>Doctor Name</th>
                <th>Disease</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appt, index) => (
                <tr key={appt._id}>
                  <td>{index + 1}</td>
                  <td>{appt.doctorName || 'N/A'}</td>
                  <td>{appt.disease ? appt.disease.charAt(0).toUpperCase() + appt.disease.slice(1) : 'N/A'}</td>
                  <td>{appt.date}</td>
                  <td>{appt.time}</td>
                  <td style={{ textTransform: 'capitalize' }}>{appt.status || 'Pending'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showNotifications && (
        <div className="custom-modal-overlay">
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h3>Notifications</h3>
              <button
                className="modal-close-button"
                onClick={() => setShowNotifications(false)}
              >
                &times;
              </button>
            </div>
            <div className="custom-modal-body">
              {notifications.length === 0 ? (
                <p>No notifications available.</p>
              ) : (
                <ul className="notification-list">
                  {notifications.map(notification => (
                    <li
                      key={notification._id}
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                    >
                      <FontAwesomeIcon
                        icon={notification.status === 'approved' ? faCheckCircle : faTimesCircle}
                        className={notification.status === 'approved' ? 'text-success' : 'text-danger'}
                      />
                      <span className="notification-message">{notification.message}</span>
                      {!notification.read && (
                        <button
                          className="button-notification"
                          onClick={() => markAsRead(notification._id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="custom-modal-footer">
              <button
                className="button-secondary"
                onClick={() => setShowNotifications(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PatientAppointments;