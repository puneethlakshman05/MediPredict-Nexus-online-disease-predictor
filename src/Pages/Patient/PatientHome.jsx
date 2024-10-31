import React, { useState, useEffect } from 'react';
import { Container, ListGroup, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';

function PatientSymptoms() {
  const [symptomsOptions, setSymptomsOptions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [disease, setDisease] = useState(null);
  const [medications, setMedications] = useState([]);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [error, setError] = useState('');

  // Fetch symptoms list from Flask API
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/symptoms');
        const options = response.data.map((symptom) => ({ 
          label: symptom.replace('_',' '),
          value: symptom,
        }));      
        setSymptomsOptions(options);      
        console.log(options);
      } catch (error) {
        console.error("Error fetching symptoms:", error);
        setError('Failed to load symptoms. Please try again later.');
      }
    };
    fetchSymptoms();
  }, []);

  // Handle symptom submission and fetch disease data
  const submitSymptoms = async () => {
    if (selectedSymptoms.length < 3) {
      setError('Please select at least 3 symptoms for an accurate prediction.');
      return;
    }

    try {
      setError('');
      const symptomsArray = selectedSymptoms.map((symptom) => symptom.value);
      
      // Fetch disease prediction based on symptoms
      const response = await axios.get('http://127.0.0.1:5000/disease', {params:{ symptoms: JSON.stringify(symptomsArray)} });
      setDisease(response.data);
      setMedications([]); // Reset medications when a new disease is predicted
      setAvailableDoctors([]); // Reset doctors when a new disease is predicted
    } catch (error) {
      console.error("Error fetching data:", error);
      setError('An error occurred while fetching data. Please try again.');
    }
  };

  // Fetch medications for the predicted disease
  const fetchMedications = async () => {
    try {
      const medResponse = await axios.get(`http://127.0.0.1:5000/medications?disease=${disease}`);
      setMedications(medResponse.data.medications);
    } catch (error) {
      console.error("Error fetching medications:", error);
      setError('Failed to load medications. Please try again later.');
    }
  };

  // Fetch doctors for the predicted disease specialization
  const fetchDoctors = async () => {
    try {
      const doctorResponse = await axios.get(`http://127.0.0.1:5000/doctors?specialization=${disease}`);
      setAvailableDoctors(doctorResponse.data.doctors);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setError('Failed to load doctors. Please try again later.');
    }
  };

  return (
    <Container>
      <h3>Select Symptoms</h3>
      <Row>
        <Col>
          <Select
            options={symptomsOptions}
            isMulti
            placeholder="Select symptoms..."
            value={selectedSymptoms}
            onChange={setSelectedSymptoms}
          />
          <Button onClick={submitSymptoms} variant="success" className="mt-3">
            Predict
          </Button>
        </Col>
      </Row>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

      {disease && (
        <Alert variant="info" className="mt-3">
          <h4>Predicted Disease: {disease}</h4>
          <Button onClick={fetchMedications} variant="primary" className="mt-3 me-3">
            Medication
          </Button>
          <Button onClick={fetchDoctors} variant="primary" className="mt-3">
            Available Doctors
          </Button>
        </Alert>
      )}

      {medications.length > 0 && (
        <div className="mt-3">
          <h5>Recommended Medications:</h5>
          <ListGroup>
            {medications.map((med, idx) => (
              <ListGroup.Item key={idx}>{med}</ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}




      {availableDoctors.length > 0 && (
        <div className="mt-3">
          <h5>Available Doctors:</h5>
          <ListGroup>
            {availableDoctors.map((doc, idx) => (
              <ListGroup.Item key={idx}>
                Dr. {doc.name} - {doc.specialization}
                <Button variant="link" className="ms-2">
                  Book Appointment
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </div>
      )}
    </Container>
  );
}

export default PatientSymptoms;
