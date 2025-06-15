
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" id="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h5>About Us</h5>
          <p>
            Online Hospital is dedicated to revolutionizing healthcare by enabling you to detect diseases effortlessly through your smart devices. Our platform offers a seamless online health checker, providing personalized insights and connecting you with top medical professionals. Your health is our priority, and we strive to make healthcare accessible, efficient, and reliable for everyone.
          </p>
        </div>
        <div className="footer-section">
          <h5>Contact Us</h5>
          <p>
            <span className="contact-label">Email:</span>
            <br />
            <a
              href="mailto:admin@hospital.com"
              className="email-link"
              rel="noopener noreferrer"
            >
              <i className="fas fa-envelope email-icon"></i> admin@hospital.com
            </a>
            <br />
            <a
              href="mailto:puneethlaksh05@gmail.com"
              className="email-link"
              rel="noopener noreferrer"
            >
              <i className="fas fa-envelope email-icon"></i> puneethlaksh05@gmail.com
            </a>
          </p>
          <p>
            <span className="contact-label">Phone:</span>
            <br />
            <a
              href="tel:+917989736421"
              className="phone-link"
              rel="noopener noreferrer"
            >
              <i className="fas fa-phone phone-icon"></i> +91 7989736421
            </a>
          </p>
          <p>Address: RGUKT-ONGOLE, SSN Engineering College, Pernamitta Rural, Andhra Pradesh, Ongole, 523225</p>
        </div>
        <div className="footer-section">
          <h5>Follow Us</h5>
          <div className="social-links">
            <a href="#" className="social-icon"><i className="fab fa-facebook"></i></a>
            <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
            <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
            <a
              href="https://www.linkedin.com/in/puneeth-lakshman-veligonda-64899534a?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
              className="social-icon"
              rel="noopener noreferrer"
            >
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} MediPredict Nexus | All Rights Reserved
      </div>
    </footer>
  );
};

export default Footer;