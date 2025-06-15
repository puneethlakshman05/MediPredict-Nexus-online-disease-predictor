
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import './PatientAppointments.css';

function PatientAppointments({ token }) {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role === 'patient') {
      const patientEmail= storedUser.email;
      axios
        .get(`http://localhost:5000/api/appointments/patient/${patientEmail}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (!Array.isArray(res.data)) {
            setError('Unexpected response format from server');
            return;
          }
          setAppointments(res.data);
          if (res.data.length === 0) {
            setError('No appointments found for this patient.');
          }
        })
        .catch((err) => {
          console.error('Error fetching appointments:', err);
          setError('Failed to load appointments: ' + (err.response?.data?.error || err.message));
        });
    } else {
      setError('No logged-in patient found.');
    }
  }, [token]);

  return (
    <div className="container">
      <h1>Your Appointments</h1>
      {error && <div className="alert alert-danger">{error}</div>}
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
    </div>
  );
}

PatientAppointments.propTypes = {
  token: PropTypes.string.isRequired,
};

export default PatientAppointments;
