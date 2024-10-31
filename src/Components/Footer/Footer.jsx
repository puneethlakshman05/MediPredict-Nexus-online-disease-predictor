import React from 'react';
import'./Footer.css';
const Footer = () => {
  return (
    <footer className="footer bg-dark text-white">
      <div className="container py-4">
        <div className="row">
          <div className="col-md-4">
            <h5>About Us</h5>
            <p><b>Detect your Diseases effortlessly through your Smart devices. An online helath checker in your laps.</b></p>
          </div>
          <div className="col-md-4">
            <h5>Contact Us</h5>
            <p>Email: admin@hospital.com</p>
            <p>Phone:+91 7989736421</p>
            <p>Address: 1234 Hospital Lane, Medical street,Ongole</p>
          </div>
          <div className="col-md-4">
            <h5>Follow Us</h5>
            <a href="#" className="text-white me-2"><i className="fab fa-facebook"></i></a>
            <a href="#" className="text-white me-2"><i className="fab fa-twitter"></i></a>
            <a href="#" className="text-white me-2"><i className="fab fa-instagram"></i></a>
            <a href="#" className="text-white"><i className="fab fa-linkedin"></i></a>
          </div>
        </div>
      </div>
      <div className="footer-bottom text-center py-3">
        &copy; 2024 HospitalWebsite | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;
