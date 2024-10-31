import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function DoctorHome() {
  const navigate = useNavigate();

  return (
    <Container className="mt-4">
      <h1>Doctor Dashboard</h1>
      <Row className="mt-4">
        <Col md={6} className="mb-3">
          <Button variant="primary" className="w-100" onClick={() => navigate('/doctor/appointments')}>
            View Appointments
          </Button>
        </Col>
        <Col md={6} className="mb-3">
          <Button variant="success" className="w-100" onClick={() => navigate('/doctor/patients')}>
            Manage Patients
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default DoctorHome;
