// src/Components/AdminNavbar/AdminNavbar.jsx
import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './AdminNavbar.css';

function AdminNavbar({ handleLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <>
      <BootstrapNavbar expand="lg" className="admin-navbar">
        <Container fluid>
          <BootstrapNavbar.Brand href="/admin">Admin Panel</BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="adminNavbarNav" />
          <BootstrapNavbar.Collapse id="adminNavbarNav">
            <Nav className="ms-auto">
              <Nav.Link href="/admin">Dashboard</Nav.Link>
              <Nav.Link href="/admin/doctors">Doctors</Nav.Link>
              <Nav.Link href="/admin/patients">Patients</Nav.Link>
              <Nav.Link href="#" onClick={handleLogoutClick}>Logout</Nav.Link>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </>
  );
}

export default AdminNavbar;
