import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import NotificationModal from '../NotificationModal/NotificationModal';
import './PatientHome.css';

function PatientHome({ token }) {
  const navigate = useNavigate();
  const [symptomsOptions, setSymptomsOptions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState({ disease: '', medications: [], doctors: [] });
  const [error, setError] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [refreshNotifications, setRefreshNotifications] = useState(0);
  const [showMedications, setShowMedications] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showNoDoctorsModal, setShowNoDoctorsModal] = useState(false);

  const fetchSymptoms = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/symptoms', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSymptomsOptions(res.data.map(s => ({ label: s.replace('_', ' '), value: s })));
    } catch (err) {
      setError('Failed to load symptoms.');
      console.error('Fetch symptoms error:', err);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role === 'patient') {
      const patientEmail = storedUser.email;
      console.log('Fetching notifications for:', patientEmail);
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${patientEmail}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Notifications fetched:', res.data);
        setNotifications(res.data);
        const unreadCount = res.data.filter(notif => !notif.read).length;
        setUnreadNotifications(unreadCount);
      } catch (err) {
        console.error('Failed to load notifications:', err.response?.data || err.message);
        setError('Failed to load notifications.');
      }
    } else {
      setError('No logged-in patient found.');
      console.error('Stored user:', storedUser);
    }
  }, [token]);

  const submitSymptoms = useCallback(async () => {
    if (selectedSymptoms.length < 3) {
      setError('Select at least 3 symptoms.');
      return;
    }
    try {
      setError('');
      setShowMedications(false);
      setShowDoctors(false);
      setShowNoDoctorsModal(false);
      const symptoms = selectedSymptoms.map(s => s.value);
      const diseaseRes = await axios.get('http://localhost:5000/api/disease', {
        params: { symptoms: JSON.stringify(symptoms) },
        headers: { Authorization: `Bearer ${token}` }
      });
      const disease = diseaseRes.data.disease;
      const medRes = await axios.get(`http://localhost:5000/api/medications?disease=${encodeURIComponent(disease)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docRes = await axios.get(`http://localhost:5000/api/doctors?specialization=${encodeURIComponent(disease)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult({
        disease,
        medications: medRes.data.medications,
        doctors: docRes.data.doctors
      });
    } catch (err) {
      setError('Error predicting disease.');
      console.error('Submit symptoms error:', err);
    }
  }, [selectedSymptoms, token]);

  const handleBook = useCallback((doctor) => {
    console.log('handleBook called:', { doctor });
    localStorage.setItem('bookingData', JSON.stringify({
      doctor,
      disease: result.disease,
      symptoms: selectedSymptoms.map(s => s.label)
    }));
    navigate('/patient/book-appointment');
    setRefreshNotifications(prev => prev + 1);
  }, [navigate, result.disease, selectedSymptoms]);

  const handleViewMedications = () => {
    setShowMedications(true);
    setShowDoctors(false);
    setShowNoDoctorsModal(false);
    document.querySelector('.medication-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleBookAppointments = () => {
    setShowDoctors(true);
    setShowMedications(false);
    if (result.doctors.length === 0) {
      setShowNoDoctorsModal(true);
    } else {
      setShowNoDoctorsModal(false);
      document.querySelector('.doctors-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDismissNoDoctors = () => {
    setShowNoDoctorsModal(false);
    setShowDoctors(false);
  };

  const handleCloseMedications = () => {
    setShowMedications(false);
  };

  const handleCloseDoctors = () => {
    setShowDoctors(false);
    setShowNoDoctorsModal(false);
  };

  const handleCloseResult = () => {
    setResult({ disease: '', medications: [], doctors: [] });
    setShowMedications(false);
    setShowDoctors(false);
    setShowNoDoctorsModal(false);
  };

  useEffect(() => {
    fetchSymptoms();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchSymptoms, fetchNotifications, refreshNotifications]);

  return (
    <div className="patient-home">
      <div className="notification-container">
        <div className="notification-icon" onClick={() => setShowNotificationModal(true)}>
          <FontAwesomeIcon icon={faBell} />
          {unreadNotifications > 0 && <span className="notification-dot"></span>}
        </div>
      </div>
      <h3>Select Symptoms</h3>
      <div className="symptom-select-container">
        <Select
          options={symptomsOptions}
          isMulti
          placeholder="Select symptoms..."
          value={selectedSymptoms}
          onChange={setSelectedSymptoms}
          className="symptom-select"
        />
        <button onClick={submitSymptoms} className="button predict-button">
          Predict
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      {result.disease && (
        <div className="result-section">
          <div className="section-header">
            <h4>Predicted Disease: {result.disease}</h4>
            <button onClick={handleCloseResult} className="close-button">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <div className="action-buttons">
            <button onClick={handleViewMedications} className="button action-button">
              Medications
            </button>
            <button onClick={handleBookAppointments} className="button action-button">
              Book Appointments
            </button>
          </div>
          {showMedications && result.medications.length > 0 && (
            <div className="medication-section">
              <div className="section-header">
                <h5>Medications:</h5>
                <button onClick={handleCloseMedications} className="close-button">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <ul className="medication-list">
                {result.medications.map((med, idx) => (
                  <li key={idx}>{med}</li>
                ))}
              </ul>
            </div>
          )}
          {showDoctors && result.doctors.length > 0 && (
            <div className="doctors-section">
              <div className="section-header">
                <h5>Doctors for {result.disease}:</h5>
                <button onClick={handleCloseDoctors} className="close-button">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              {result.doctors.map(doc => (
                <div key={doc._id || doc.id} className="doctor-card">
                  <h6>{doc.name}</h6>
                  <p>Specialization: {doc.specialization}</p>
                  <p>Email: {doc.email}</p>
                  <button
                    onClick={() => handleBook(doc)}
                    className="button book-button"
                  >
                    Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {showNoDoctorsModal && (
        <div className="no-doctors-modal-overlay">
          <div className="no-doctors-modal">
            <div className="no-doctors-modal-content">
              <p>We regret the inconvenience; there are currently no doctors available for this specialization.</p>
              <button onClick={handleDismissNoDoctors} className="button ok-button">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      <NotificationModal
        notifications={notifications}
        setNotifications={setNotifications}
        show={showNotificationModal}
        onHide={() => setShowNotificationModal(false)}
        token={token}
      />
    </div>
  );
}

export default PatientHome;