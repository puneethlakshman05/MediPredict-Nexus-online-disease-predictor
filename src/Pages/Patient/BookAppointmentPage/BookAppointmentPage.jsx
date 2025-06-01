import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './BookAppointmentPage.css';

const BookAppointmentPage = ({ token }) => {
  const navigate = useNavigate();
  const [bookingData, setBookingData] = useState(null);
  const [error, setError] = useState('');

  // Get the logged-in user's email from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || {};

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('bookingData'));
    if (data) {
      setBookingData(data);
    } else {
      setError('No booking data found.');
      navigate('/patient');
    }
  }, [navigate]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    disease: bookingData?.disease || '',
    patientEmail: user.email || '',
    patientPhone: '',
    gender: '',
    age: '',
    date: '',
    time: '',
  });

  useEffect(() => {
    if (bookingData) {
      setFormData((prev) => ({ ...prev, disease: bookingData.disease || '' }));
    }
  }, [bookingData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Token:', token);
    console.log('Submitting form:', { formData, doctor: bookingData?.doctor });

    if (!bookingData?.doctor) {
      setError('No doctor selected.');
      return;
    }

    // Validate age to match backend constraints (0 to 100)
    const ageNumber = parseInt(formData.age, 10);
    if (isNaN(ageNumber) || ageNumber < 0 || ageNumber > 100) {
      setError('Please enter a valid age between 0 and 100.');
      return;
    }

    const newAppointment = {
      patientName: `${formData.firstName} ${formData.lastName}`,
      firstName: formData.firstName,
      lastName: formData.lastName,
      disease: formData.disease,
      patientEmail: formData.patientEmail,
      patientPhone: formData.patientPhone,
      gender: formData.gender,
      age: ageNumber,
      date: formData.date,
      time: formData.time,
      doctorName: bookingData.doctor.name,
      doctorEmail: bookingData.doctor.email,
      symptoms: bookingData.symptoms,
    };

    try {
      const response = await axios.post('http://localhost:5000/api/appointments', newAppointment, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Appointment booked:', response.data);
      localStorage.removeItem('bookingData');
      alert(`Appointment booked with Dr. ${bookingData.doctor.name}`);
      navigate('/patient/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error.response && error.response.status === 401) {
        alert('Your session has expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError(error.response?.data?.error || 'Failed to book appointment. Please try again.');
      }
    }
  };

  if (!bookingData && !error) {
    return <div className="appointment-container">Loading...</div>;
  }

  return (
    <div className="appointment-container">
      {error && <div className="error-message">{error}</div>}
      {bookingData && (
        <>
          <h2>Book Appointment with Dr. {bookingData.doctor?.name}</h2>
          <form onSubmit={handleSubmit} className="appointment-form">
            <div className="input-wrapper">
              <label className="input-label">First Name</label>
              <input
                className="input-field"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Last Name</label>
              <input
                className="input-field"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Disease</label>
              <input
                className="input-field"
                name="disease"
                value={formData.disease}
                onChange={handleInputChange}
                required
                readOnly
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Email</label>
              <input
                className="input-field"
                type="email"
                name="patientEmail"
                value={formData.patientEmail}
                onChange={handleInputChange}
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Phone</label>
              <input
                className="input-field"
                name="patientPhone"
                value={formData.patientPhone}
                onChange={handleInputChange}
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Gender</label>
              <select
                className="input-field"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Age</label>
              <input
                className="input-field"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="0"
                max="100"
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Date</label>
              <input
                className="input-field"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <hr className="form-divider" />
            <div className="input-wrapper">
              <label className="input-label">Time</label>
              <input
                className="input-field"
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="button-wrapper">
              <button type="submit" className="appointment-button submit-button">
                Submit
              </button>
              <button
                type="button"
                className="appointment-button cancel-button"
                onClick={() => {
                  localStorage.removeItem('bookingData');
                  navigate('/patient');
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default BookAppointmentPage;