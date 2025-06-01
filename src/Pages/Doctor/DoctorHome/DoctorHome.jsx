import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DoctorHome.css';

function DoctorHome({ token, email }) {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (email && token) {
      axios.get('http://localhost:5000/api/doctors', {
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
          setError('Failed to load doctor information.');
        });
    }
  }, [email, token]);

  return (
    <div className="container">
       <h1>Doctor Dashboard</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {doctor && <p className="welcome">Welcome, Dr. {doctor.name} here is your dashboard where you can review your Appointments.</p>}
     
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
    </div>
  );
}

export default DoctorHome;