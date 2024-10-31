// src/Pages/Admin/PatientsList.jsx
import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

function PatientsList() {
  const [patients, setPatients] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedPatients = JSON.parse(localStorage.getItem('patients')) || [];
    setPatients(storedPatients);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      const updatedPatients = patients.filter((patient) => patient.id !== id);
      setPatients(updatedPatients);
      localStorage.setItem('patients', JSON.stringify(updatedPatients));
      setSuccess('Patient deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddPatient = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!newPatient.name || !newPatient.email || !newPatient.password) {
      setError('All fields are required.');
      return;
    }

    // Check if email already exists
    const emailExists = patients.some((pat) => pat.email === newPatient.email);
    if (emailExists) {
      setError('Patient with this email already exists.');
      return;
    }

    const patientToAdd = {
      id: uuidv4(),
      name: newPatient.name,
      email: newPatient.email,
      password: newPatient.password, // In production, hash the password
    };

    const updatedPatients = [...patients, patientToAdd];
    setPatients(updatedPatients);
    localStorage.setItem('patients', JSON.stringify(updatedPatients));
    setSuccess('Patient added successfully!');
    setShowAddModal(false);
    setNewPatient({ name: '', email: '', password: '' });
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Container className="mt-4">
      <h1>Manage Patients</h1>
      <Button variant="success" className="mb-3" onClick={() => setShowAddModal(true)}>
        Add New Patient
      </Button>
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient, index) => (
            <tr key={patient.id}>
              <td>{index + 1}</td>
              <td>{patient.name}</td>
              <td>{patient.email}</td>
              <td>
                <Button variant="danger" onClick={() => handleDelete(patient.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {patients.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center">
                No patients found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add Patient Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Patient</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddPatient}>
            <Form.Group className="mb-3" controlId="patientName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter patient's name"
                value={newPatient.name}
                onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="patientEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter patient's email"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="patientPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={newPatient.password}
                onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
                required
              />
            </Form.Group>
            <Button variant="success" type="submit" className="w-100">
              Add Patient
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default PatientsList;
