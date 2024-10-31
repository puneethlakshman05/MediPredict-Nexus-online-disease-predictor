import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal } from 'react-bootstrap';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    disease: '',
    email: '',
    phone: '',
    date: '',
    time: ''
  });

  useEffect(() => {
    // Fetch doctors from localStorage or API
    const storedDoctors = JSON.parse(localStorage.getItem('doctors')) || [];
    setDoctors(storedDoctors);

    // Fetch appointments from localStorage
    const storedAppointments = JSON.parse(localStorage.getItem('appointments')) || [];
    setAppointments(storedAppointments);
  }, []);

  // Handles opening the modal and selecting a doctor
  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);  // Open modal when clicked
  };

  // Handles form submission and appointment saving
  const handleSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      ...formData,
      doctor: selectedDoctor.name
    };
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    localStorage.setItem('appointments', JSON.stringify(updatedAppointments));
    setShowModal(false); // Close modal after booking
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <Container className="mt-4">
      <h2>Your Appointments</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Date</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length > 0 ? (
            appointments.map((appt, index) => (
              <tr key={index}>
                <td>{appt.doctor}</td>
                <td>{appt.date}</td>
                <td>{appt.time}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">No appointments found.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <h3 className="mt-4">Available Doctors:</h3>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Doctor</th>
            <th>Specialization</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {doctors.length > 0 ? (
            doctors.map((doctor, index) => (
              <tr key={index}>
                <td>{doctor.name}</td>
                <td>{doctor.specialization}</td>
                <td>
                  <Button onClick={() => handleBookAppointment(doctor)}>Book an Appointment</Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="text-center">No doctors available.</td>
            </tr>
          )}
        </tbody>
      </Table>

      {/* Appointment Booking Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Book Appointment with Dr. {selectedDoctor?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Disease</label>
              <input 
                type="text" 
                className="form-control" 
                name="disease" 
                value={formData.disease} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input 
                type="email" 
                className="form-control" 
                name="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input 
                type="tel" 
                className="form-control" 
                name="phone" 
                value={formData.phone} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input 
                type="date" 
                className="form-control" 
                name="date" 
                value={formData.date} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input 
                type="time" 
                className="form-control" 
                name="time" 
                value={formData.time} 
                onChange={handleInputChange} 
                required 
              />
            </div>
            <Button type="submit" className="mt-3">Submit</Button>
          </form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default PatientAppointments;
