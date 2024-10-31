// src/Pages/Doctor/Patients.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Alert } from 'react-bootstrap';

function Patients() {
  const [patients, setPatients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch patients associated with the doctor
    // Assuming appointments link patients to doctors
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role === 'doctor') {
      const doctorId = storedUser.id;
      const allAppointments = [];

      // Gather all appointments from localStorage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('appointments_doctor_')) {
          const appointments = JSON.parse(localStorage.getItem(key)) || [];
          allAppointments.push(...appointments);
        }
      });

      // Extract unique patients
      const uniquePatients = {};
      allAppointments.forEach((appt) => {
        if (appt.doctorId === doctorId) {
          uniquePatients[appt.email] = appt; // Using email as unique identifier
        }
      });

      setPatients(Object.values(uniquePatients));
      console.log(`Patients for doctor ID ${doctorId}:`, Object.values(uniquePatients)); // Debugging
    } else {
      setError('No logged-in doctor found.');
      console.error('No logged-in doctor found.');
    }
  }, []);

  return (
    <Container className="mt-4">
      <h1>Your Patients</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Patient Name</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((patient, index) => (
              <tr key={patient.email}>
                <td>{index + 1}</td>
                <td>{patient.name}</td>
                <td>{patient.email}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default Patients;
