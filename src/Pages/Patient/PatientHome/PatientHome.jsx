
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCapsules, faSyringe, faTimes } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import './PatientHome.css';
import API_BASE_URL from "../../../config";

function PatientHome({ token }) {
  const navigate = useNavigate();
  const [symptomsOptions, setSymptomsOptions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [result, setResult] = useState({ disease: '', medicines: [], doctors: [] });
  const [error, setError] = useState('');
  const [showMedications, setShowMedications] = useState(false);
  const [showDoctors, setShowDoctors] = useState(false);
  const [showNoDoctorsModal, setShowNoDoctorsModal] = useState(false);

  const fetchSymptoms = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/symptoms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSymptomsOptions(res.data.map(s => ({ label: s.replace('_', ' '), value: s })));
    } catch (err) {
      setError('Failed to load symptoms.');
      console.error('Fetch symptoms error:', err);
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
      const diseaseRes = await axios.get(`${API_BASE_URL}/api/diseas`, {
        params: { symptoms: JSON.stringify(symptoms) },
        headers: { Authorization: `Bearer ${token}` }
      });
      const disease = diseaseRes.data.disease;
      const medRes = await axios.get(`${API_BASE_URL}/api/medications?disease=${encodeURIComponent(disease)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const docRes = await axios.get(`${API_BASE_URL}/api/doctors?specialization=${encodeURIComponent(disease)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult({
        disease,
        medicines: medRes.data.medicines || [],
        injections:medRes.data.injections || [],
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
    setResult({ disease: '', medications: [], injections: [], doctors: [] });
    setShowMedications(false);
    setShowDoctors(false);
    setShowNoDoctorsModal(false);
  };

  useEffect(() => {
    fetchSymptoms();
  }, [fetchSymptoms]);

  return (
    <div className="patient-home">
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
          {showMedications && (result.medicines.length > 0 || result.injections.length > 0) && (
            <div className="medication-section">
              <div className="section-header">
                <h5>Medications:</h5>
                <button onClick={handleCloseMedications} className="close-button">
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
             {result.medicines.length > 0 && (
                <>
                  <h6>
                    <FontAwesomeIcon icon={faCapsules} className='medication-icon'/>
                     Medicines:</h6>
                  <p className='medication-paragraph'>{result.medicines.join(' ')}</p>
                </>
              )}
              {result.injections.length > 0 && (
                <>
                  <h6>
                    <FontAwesomeIcon icon={faSyringe} className='medication-icon '/>
                    Injections:
                    </h6>
                  <p className='medication-paragraph'>{result.injections.join('  ')}</p>
                </>
              )}
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
    </div>
  );
}

PatientHome.propTypes = {
  token: PropTypes.string.isRequired
};

export default PatientHome;
