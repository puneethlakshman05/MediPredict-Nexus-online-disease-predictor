import { useState, useEffect } from 'react';
import './HeroCarousel.css';

// Import images (replace with your actual image paths)
import image1 from '../../assets/images/image1.jpg';
import image2 from '../../assets/images/image2.jpg';
import image3 from '../../assets/images/image3.jpg';

// Define the slides data
const slides = [
  {
    type: 'hero', // Special type for HeroSection content
  },
  {
    type: 'image',
    src: image1,
    alt: 'First slide',
  },
  {
    type: 'image',
    src: image2,
    alt: 'Second slide',
  },
  {
    type: 'image',
    src: image3,
    alt: 'Third slide',
  },
];

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-slide every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  const handlePrev = () => {
    setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  const goToSlide = (index) => {
    setActiveIndex(index);
  };

  return (
    <div className="hero-carousel">
      {/* Carousel Slides */}
      <div
        className="carousel-slides"
        style={{ transform: `translateX(-${activeIndex * 25}%)` }} // Adjusted to 25% per slide
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className={`carousel-slide ${activeIndex === index ? 'active' : ''}`}
          >
            {slide.type === 'hero' ? (
              // HeroSection content as the first slide
              <div className="hero-section">
                <div className="hero-content">
                  <h1>Welcome to MediPredict Nexus</h1>
                  <p>Your health is our priority. Access our services seamlessly and effortlessly.</p>
                  <a href="#services" className="hero-btn">
                    Explore Services
                  </a>
                </div>
              </div>
            ) : (
              // Image slides
              <div className="image-slide">
                <img src={slide.src} alt={slide.alt} className="slide-image" />
                {slide.caption && (
                  <div className="carousel-caption">
                    <h4>{slide.caption}</h4>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button className="carousel-control prev" onClick={handlePrev}>
        <span>&lt;</span>
      </button>
      <button className="carousel-control next" onClick={handleNext}>
        <span>&gt;</span>
      </button>

      {/* Indicators */}
      <div className="carousel-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator ${activeIndex === index ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;