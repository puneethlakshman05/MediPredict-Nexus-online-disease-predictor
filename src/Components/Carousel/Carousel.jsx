import React from 'react';
import { Carousel as BootstrapCarousel } from 'react-bootstrap';
import './Carousel.css';

import image1 from '../../assets/images/image1.jpg';
import image2 from '../../assets/images/image2.jpg';
import image3 from '../../assets/images/image3.jpg';

function Carousel() {
  return (
    <BootstrapCarousel>
      <BootstrapCarousel.Item>
        <img className="d-block w-100" src={image1} alt="First slide" />
      </BootstrapCarousel.Item>
      <BootstrapCarousel.Item>
        <img className="d-block w-100" src={image2} alt="Second slide" />
        <BootstrapCarousel.Caption>
          <h3 classname="caption">A computer can become your online Health checker</h3>
        </BootstrapCarousel.Caption>
      </BootstrapCarousel.Item>
      <BootstrapCarousel.Item>
        <img className="d-block w-100" src={image3} alt="Third slide" />
      </BootstrapCarousel.Item>
    </BootstrapCarousel>
  );
}

export default Carousel;
