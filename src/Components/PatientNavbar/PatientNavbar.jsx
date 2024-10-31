// src/Components/PatientNavbar/PatientNavbar.jsx
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './PatientNavbar.css';

function PatientNavbar({ handleLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <>
      <BootstrapNavbar expand="lg" className="patient-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand href="/patient">Patient Panel</BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="patientNavbarNav" />
          <BootstrapNavbar.Collapse id="patientNavbarNav">
            <Nav className="ms-auto">
              <Nav.Link href="/patient">Dashboard</Nav.Link>
              <Nav.Link href="/patient/appointments">Appointments</Nav.Link>
              <Nav.Link href="/patient/records">Records</Nav.Link>
              <Nav.Link href="#" onClick={handleLogoutClick}>Logout</Nav.Link>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </>
  );
}

export default PatientNavbar;
