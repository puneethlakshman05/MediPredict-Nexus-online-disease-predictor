// src/Components/HeroSection/HeroSection.jsx
import React from 'react';
import { Container } from 'react-bootstrap';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <Container className="mt-6 hero-section">
      <h1>Welcome to Our Website</h1>
      <p>Your health is our priority. Access our services seamlessly.</p>
    </Container>
  );
};

export default HeroSection;
