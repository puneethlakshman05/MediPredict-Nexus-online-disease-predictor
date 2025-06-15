import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './AdminHome.css';

function AdminHome() {
  const navigate = useNavigate();

  // State to manage hover effects for buttons
  const [isDoctorsHovered, setDoctorsHovered] = useState(false);
  const [isPatientsHovered, setPatientsHovered] = useState(false);

  // State for analytics data
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalPatients: 0,
    totalAppointments: 0,
  });

  // State for doctors and popup data
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);

  // State for popup
  const [showPopup, setShowPopup] = useState(false);

  // State for error messages
  const [error, setError] = useState('');

  // Fetch data function
  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication token not found. Please log in again.');
        navigate('/login/admin');
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      // Fetch total doctors
      const doctorsResponse = await axios.get('http://localhost:5000/api/doctors', config);
      const doctorsData = doctorsResponse.data.doctors || doctorsResponse.data;
      if (!Array.isArray(doctorsData)) {
        throw new Error('Doctors data is not an array');
      }
      setStats(prev => ({ ...prev, totalDoctors: doctorsData.length }));
      setDoctors(doctorsData);

      // Fetch total patients
      const patientsResponse = await axios.get('http://localhost:5000/api/patients', config);
      const patientsData = patientsResponse.data.patients || patientsResponse.data;
      if (!Array.isArray(patientsData)) {
        throw new Error('Patients data is not an array');
      }
      setStats(prev => ({ ...prev, totalPatients: patientsData.length }));

      // Fetch total appointments
      const appointmentsResponse = await axios.get('http://localhost:5000/api/appointments', config);
      const appointmentsData = appointmentsResponse.data;
      if (!Array.isArray(appointmentsData)) {
        throw new Error('Appointments data is not an array');
      }
      setStats(prev => ({ ...prev, totalAppointments: appointmentsData.length }));

      setError('');
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(`Failed to load dashboard data: ${err.message || 'Unknown error'}`);
    }
  };

  // Fetch appointments for a specific doctor
  const fetchDoctorAppointments = async (doctorName) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      const appointmentsResponse = await axios.get('http://localhost:5000/api/appointments', config);
      const appointmentsData = appointmentsResponse.data;
      const filteredAppointments = appointmentsData.filter(
        appt => appt.doctorName === doctorName
      );
      setDoctorAppointments(filteredAppointments);
    } catch (err) {
      console.error(`Failed to fetch appointments for ${doctorName}:`, err);
      setError(`Failed to load appointments: ${err.message || 'Unknown error'}`);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [navigate]);

  return (
    <div className="page-container short-content">
      <div className="admin-home-container">
        <h1 className="admin-heading">Admin Dashboard</h1>
        <p className="welcome-text">Welcome Mr. Admin, here’s your required information</p>
        <div className="button-row">
          <div className="button-col">
            <button
              className={`manage-doctors-button ${isDoctorsHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setDoctorsHovered(true)}
              onMouseLeave={() => setDoctorsHovered(false)}
              onClick={() => navigate('/admin/doctors')}
            >
              Manage Doctors
            </button>
          </div>
          <div className="button-col">
            <button
              className={`manage-patients-button ${isPatientsHovered ? 'hovered' : ''}`}
              onMouseEnter={() => setPatientsHovered(true)}
              onMouseLeave={() => setPatientsHovered(false)}
              onClick={() => navigate('/admin/patients')}
            >
              Manage Patients
            </button>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section">
          {error && <div className="error-message">{error}</div>}

          <div className="stats-container">
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-label">Total Doctors</div>
                <div className="stat-number">{stats.totalDoctors}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Total Patients</div>
                <div className="stat-number">{stats.totalPatients}</div>
              </div>
            </div>
            <div className="stats-row centered">
              <div
                className="stat-card clickable"
                onClick={() => {
                  setShowPopup(true);
                  setSelectedDoctor(null);
                  setDoctorAppointments([]);
                }}
              >
                <div className="stat-label">Total Appointments</div>
                <div className="stat-number">{stats.totalAppointments}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Popup for Total Appointments */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup">
              <h3 className="popup-heading">Doctors and Appointments</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowPopup(false);
                  setSelectedDoctor(null);
                  setDoctorAppointments([]);
                }}
              >
                ×
              </button>
              <div className="activity-content">
                <div className="doctors-table-container">
                  <h4 className="activity-subheading">Registered Doctors</h4>
                  {doctors.length > 0 ? (
                    <table className="activity-table doctors-table">
                      <thead>
                        <tr className="table-header">
                          <th className="table-header-cell">Doctor Name</th>
                          <th className="table-header-cell">Specialization</th>
                          <th className="table-header-cell">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doctors.map(doctor => (
                          <tr key={doctor._id} className="table-row">
                            <td className="table-cell">{doctor.name || 'N/A'}</td>
                            <td className="table-cell">{doctor.specialization || 'N/A'}</td>
                            <td className="table-cell">
                              <a
                                href="#"
                                className="action-link"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedDoctor(doctor.name);
                                  fetchDoctorAppointments(doctor.name);
                                }}
                              >
                                View Details
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-activity">No registered doctors found.</p>
                  )}
                </div>

                {selectedDoctor && (
                  <div className="appointments-table-container">
                    <div className="appointments-table-header">
                      <h4 className="activity-subheading">Appointments for {selectedDoctor}</h4>
                      <button
                        className="close-appointments-btn"
                        onClick={() => {
                          setSelectedDoctor(null);
                          setDoctorAppointments([]);
                        }}
                      >
                        ×
                      </button>
                    </div>
                    {doctorAppointments.length > 0 ? (
                      <table className="activity-table appointments-table">
                        <thead>
                          <tr className="table-header">
                            <th className="table-header-cell">Patient Name</th>
                            <th className="table-header-cell">Patient Email</th>
                            <th className="table-header-cell">Doctor Name</th>
                            <th className="table-header-cell">Specialization</th>
                            <th className="table-header-cell">Disease</th>
                            <th className="table-header-cell">Date</th>
                            <th className="table-header-cell">Time</th>
                            <th className="table-header-cell">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {doctorAppointments.map(appt => (
                            <tr key={appt._id} className="table-row">
                              <td className="table-cell">{appt.patientName || 'N/A'}</td>
                              <td className="table-cell">{appt.patientEmail || 'N/A'}</td>
                              <td className="table-cell">{appt.doctorName || 'N/A'}</td>
                              <td className="table-cell">{appt.specialization || 'N/A'}</td>
                              <td className="table-cell">{appt.disease || 'N/A'}</td>
                              <td className="table-cell">{appt.date || new Date(appt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                              <td className="table-cell">{appt.time || '-'}</td>
                              <td className="table-cell">{appt.status || 'pending'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="no-activity">No appointments found for {selectedDoctor}.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminHome;