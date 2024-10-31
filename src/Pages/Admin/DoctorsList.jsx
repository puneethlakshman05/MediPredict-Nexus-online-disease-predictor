import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid';

function DoctorsList() {
  const [doctors, setDoctors] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', email: '', password: '', specialization: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const storedDoctors = JSON.parse(localStorage.getItem('doctors')) || [];
    setDoctors(storedDoctors);
  }, []);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      const updatedDoctors = doctors.filter((doctor) => doctor.id !== id);
      setDoctors(updatedDoctors);
      localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
      setSuccess('Doctor deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleAddDoctor = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation
    if (!newDoctor.name || !newDoctor.email || !newDoctor.password || !newDoctor.specialization) {
      setError('All fields are required.');
      return;
    }

    // Check if email already exists
    const emailExists = doctors.some((doc) => doc.email === newDoctor.email);
    if (emailExists) {
      setError('Doctor with this email already exists.');
      return;
    }

    const doctorToAdd = {
      id: uuidv4(),
      name: newDoctor.name,
      email: newDoctor.email,
      password: newDoctor.password, // In production, hash the password
      specialization: newDoctor.specialization.trim().toLowerCase(),
    };

    const updatedDoctors = [...doctors, doctorToAdd];
    setDoctors(updatedDoctors);
    localStorage.setItem('doctors', JSON.stringify(updatedDoctors));
    setSuccess('Doctor added successfully!');
    setShowAddModal(false);
    setNewDoctor({ name: '', email: '', password: '', specialization: '' });
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Container className="mt-4">
      <h1>Manage Doctors</h1>
      <Button variant="primary" className="mb-3" onClick={() => setShowAddModal(true)}>
        Add New Doctor
      </Button>
      {success && <Alert variant="success">{success}</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Specialization</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {doctors.map((doctor, index) => (
            <tr key={doctor.id}>
              <td>{index + 1}</td>
              <td>{doctor.name}</td>
              <td>{doctor.email}</td>
              <td>{doctor.specialization ? doctor.specialization.charAt(0).toUpperCase() + doctor.specialization.slice(1) : ''}</td>
              <td>
                <Button variant="danger" onClick={() => handleDelete(doctor.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
          {doctors.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No doctors found.
              </td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Add Doctor Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Doctor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddDoctor}>
            <Form.Group className="mb-3" controlId="doctorName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter doctor's name"
                value={newDoctor.name}
                onChange={(e) => setNewDoctor({ ...newDoctor, name: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="doctorEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter doctor's email"
                value={newDoctor.email}
                onChange={(e) => setNewDoctor({ ...newDoctor, email: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="doctorPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter password"
                value={newDoctor.password}
                onChange={(e) => setNewDoctor({ ...newDoctor, password: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="doctorSpecialization">
              <Form.Label>Specialization</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter specialization"
                value={newDoctor.specialization}
                onChange={(e) => setNewDoctor({ ...newDoctor, specialization: e.target.value })}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              Add Doctor
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

export default DoctorsList;
