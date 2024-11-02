import React, { useState, useEffect } from 'react';
import { Container, ListGroup, Button, Alert, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import Select from 'react-select';

function PatientSymptoms() {
  const [symptomsOptions, setSymptomsOptions] = useState([]);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [medications, setMedications] = useState([]);
  const [tips, setTips] = useState([]);
  const [diseaseData, setDiseaseData] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [error, setError] = useState('');

  // Fetch symptoms list from Flask API
  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/symptoms');
        const options = response.data.map((symptom) => ({
          label: symptom.replace('_', ' '),
          value: symptom,
        }));
        setSymptomsOptions(options);
        console.log("Fetched Symptoms Options:", options);
      } catch (error) {
        console.error("Error fetching symptoms:", error);
        setError('Failed to load symptoms. Please try again later.');
      }
    };
    fetchSymptoms();
  }, []);

  // Handle symptom submission and fetch disease prediction and medication data
  const submitSymptoms = async (symptoms) => {
    try {
        // Ensure `symptoms` is a valid array
        if (!Array.isArray(symptoms) || symptoms.length === 0) {
            console.error("Symptoms are not valid or empty:", symptoms);
            setError("Please select symptoms before predicting.");
            return;
        }

        // Map symptoms to their names for the request
        const symptomNames = symptoms.map(symptom => symptom.value);
        console.log("Submitting Symptom Names:", symptomNames);

        // Fetch disease prediction based on symptoms
        const response = await axios.get('http://127.0.0.1:5000/disease', {
            params: { symptoms: JSON.stringify(symptomNames) }
        });
        console.log("Backend Response:", response.data);

        // Check if disease data was returned
        const disease = response.data.predicted_disease; // Adjusted to match the response structure
        if (!disease) {
            throw new Error('No disease information returned.');
        }

        // Set disease data in state
        setDiseaseData(response.data);
        console.log("Disease Data:", response.data);

        // Fetch medications and healthcare tips based on the predicted disease
        const medicationsResponse = await axios.get('http://127.0.0.1:5000/medications', {
            params: { disease }
        });

        // Check for medications and tips
        if (!medicationsResponse.data || !medicationsResponse.data.medications) {
            console.warn('No medication information returned or empty medications array.');
            setMedications([]); // Handle case of no medications
        } else {
            setMedications(medicationsResponse.data.medications);
            setTips(medicationsResponse.data.tips || []);
        }

        // Reset available doctors for a new disease
        setAvailableDoctors([]);

        // Clear any error messages on successful data fetch
        setError(null);

    } catch (error) {
        console.error("Error fetching data:", error);
        setError(`An error occurred: ${error.message}`);
    }
};

  // Fetch doctors for the predicted disease specialization
  const fetchDoctors = async () => {
    if (!diseaseData) return;
    try {
      const doctorResponse = await axios.get(`http://127.0.0.1:5000/doctors?specialization=${diseaseData.disease}`);
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
          <Button onClick={() => submitSymptoms(selectedSymptoms)} variant="success" className="mt-3">
            Predict
          </Button>
        </Col>
      </Row>
      {error && <Alert variant="danger" className="mt-2">{error}</Alert>}

      {diseaseData && (
        <Alert variant="info" className="mt-3">
          <h4>Predicted Disease: {diseaseData.predicted_disease}</h4>
          <h5>Suggested Medications:</h5>
          <ul>
            {medications.map((med, index) => (
              <li key={index}>{med}</li>
            ))}
          </ul>
          <h5>Tips:</h5>
          <ul>
            {tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
          <Button onClick={fetchDoctors} variant="primary" className="mt-3">
            Available Doctors
          </Button>
        </Alert>
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
