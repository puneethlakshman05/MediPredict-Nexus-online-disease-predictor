import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import './DoctorHome.css';
import API_BASE_URL from "../../../config";

function DoctorHome({ token, email }) {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalAppointments: 0, pendingAppointments: 0, totalPatients: 0 });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!email || !token) {
      setError('Missing email or token.');
      return;
    }

    // Fetch doctor info
    axios.get(`${API_BASE_URL}/api/doctors`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const foundDoctor = res.data.doctors.find(doc => doc.email === email);
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          setError('Doctor not found.');
        }
      })
      .catch(err => {
        console.error('Failed to fetch doctor info:', err);
        setError('Failed to load doctor information: ' + (err.response?.data?.error || err.message));
      });

    // Fetch dashboard stats
    axios.get(`${API_BASE_URL}/api/appointments/doctor/${email}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        const appointments = res.data;
        const total = appointments.length;
        const pending = appointments.filter(appt => appt.status === 'pending').length;
        const uniquePatients = [...new Set(appointments.map(appt => appt.patientEmail))].length;
        setStats({ totalAppointments: total, pendingAppointments: pending, totalPatients: uniquePatients });

        // Fetch recent activity (last 5 appointments as recent activity)
        const recent = appointments
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentActivity(recent);
      })
      .catch(err => {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Failed to load dashboard stats: ' + (err.response?.data?.error || err.message));
      });
  }, [email, token]);

  return (
    <div className="container">
      <h1>
        <FontAwesomeIcon icon={faUserDoctor} className="dashboard-icon" /> Doctor Dashboard
      </h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {doctor && (
        <p className="welcome">
          Welcome, Dr. {doctor.name}, here is your dashboard where you can review your Appointments.
        </p>
      )}

      <div className="button-group">
        <button
          className="button button-primary"
          onClick={() => navigate('/doctor/appointments')}
        >
          View Appointments
        </button>
        <button
          className="button button-success"
          onClick={() => navigate('/doctor/patients')}
        >
          Manage Patients
        </button>
      </div>

      {/* Dashboard Overview Section */}
      <div className="dashboard-overview">
        <h2>Overview</h2>
        <div className="stats-container">
          <div className="stats-row">
            <div className="stat-card">
              <h3>Total Appointments</h3>
              <p className="stat-number">{stats.totalAppointments}</p>
            </div>
            <div className="stat-card">
              <h3>Pending Appointments</h3>
              <p className="stat-number">{stats.pendingAppointments}</p>
            </div>
          </div>
          <div className="stats-row centered">
            <div className="stat-card">
              <h3>Total Patients</h3>
              <p className="stat-number">{stats.totalPatients}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p>No recent activity available.</p>
        ) : (
          <ul className="activity-list">
            {recentActivity.map(activity => (
              <li key={activity._id} className="activity-item">
                <span className="activity-date">
                  {new Date(activity.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                <span className="activity-message">
                  Appointment with {activity.patientName} - Status: {activity.status || 'Pending'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

DoctorHome.propTypes = {
  token: PropTypes.string.isRequired,
  email: PropTypes.string.isRequired,
};

export default DoctorHome;