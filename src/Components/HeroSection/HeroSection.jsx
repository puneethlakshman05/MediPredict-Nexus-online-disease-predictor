// src/Components/HeroSection/HeroSection.jsx
import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1>Welcome to Online Hospital</h1>
        <p>Your health is our priority. Access our services seamlessly.</p>
        <a href="#services" className="hero-btn">Explore Services</a>
      </div>
    </section>
  );
};

export default HeroSection;