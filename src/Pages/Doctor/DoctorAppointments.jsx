// src/Pages/Doctor/Appointments.jsx
import React, { useEffect, useState } from 'react';
import { Container, Table, Alert } from 'react-bootstrap';

function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.role === 'doctor') {
      const doctorId = storedUser.id;
      const doctorAppointments = JSON.parse(localStorage.getItem(`appointments_doctor_${doctorId}`)) || [];
      setAppointments(doctorAppointments);
      console.log(`Appointments for doctor ID ${doctorId}:`, doctorAppointments); // Debugging
    } else {
      setError('No logged-in doctor found.');
      console.error('No logged-in doctor found.');
    }
  }, []);

  return (
    <Container className="mt-4">
      <h1>Your Appointments</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      {appointments.length === 0 ? (
        <p>No appointments booked yet.</p>
      ) : (
        <Table striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Patient Name</th>
              <th>Disease</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Date</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appt, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{appt.name}</td>
                <td>{appt.disease.charAt(0).toUpperCase() + appt.disease.slice(1)}</td>
                <td>{appt.email}</td>
                <td>{appt.phone}</td>
                <td>{appt.date}</td>
                <td>{appt.time}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}

export default Appointments;
