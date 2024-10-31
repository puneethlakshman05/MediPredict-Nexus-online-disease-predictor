// src/Pages/Admin/AdminHome.jsx
import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function AdminHome() {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <h1>Admin Dashboard</h1>
      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <Button variant="primary" className="w-100" onClick={() => navigate('/admin/doctors')}>
            Manage Doctors
          </Button>
        </Col>
        <Col md={6} className="mb-3">
          <Button variant="success" className="w-100" onClick={() => navigate('/admin/patients')}>
            Manage Patients
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminHome;
