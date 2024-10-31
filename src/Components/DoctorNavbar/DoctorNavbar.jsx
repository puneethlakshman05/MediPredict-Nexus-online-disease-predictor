// src/Components/DoctorNavbar/DoctorNavbar.jsx
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './DoctorNavbar.css';

function DoctorNavbar({ handleLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <>
      <BootstrapNavbar expand="lg" className="doctor-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand href="/doctor">Doctor Panel</BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="doctorNavbarNav" />
          <BootstrapNavbar.Collapse id="doctorNavbarNav">
            <Nav className="ms-auto">
              <Nav.Link href="/doctor">Dashboard</Nav.Link>
              <Nav.Link href="/doctor/appointments">Appointments</Nav.Link>
              <Nav.Link href="/doctor/patients">Patients</Nav.Link>
              <Nav.Link href="#" onClick={handleLogoutClick}>Logout</Nav.Link>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </>
  );
}

export default DoctorNavbar;
