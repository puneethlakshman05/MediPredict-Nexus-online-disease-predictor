import { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ProfileModal.css';

function ProfileModal({ show, onClose, user, token, updateUser }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState(user.name || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        setSelectedFile(null);
        setError('Please select a valid image file (JPEG, PNG, GIF).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSelectedFile(null);
        setError('File size must be less than 5MB.');
        return;
      }
      setSelectedFile(file);
      setError('');
    } else {
      setSelectedFile(null);
      setError('Please select an image to upload.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !name) {
      setError('Please select an image or update the name.');
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }
    if (name) {
      formData.append('name', name);
    }

    try {
      const res = await axios.post(
        'http://localhost:5000/api/update-profile',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      updateUser(res.data);
      setSuccess('Profile updated successfully!');
      setError('');
      setSelectedFile(null);
      setTimeout(() => onClose(), 2000);
    } catch (err) {
      console.error('Update error:', err.response?.data?.error || err.message);
      setError(`Failed to update profile: ${err.response?.data?.error || err.message}`);
      setSuccess('');
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Update Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="name" className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </Form.Group>
          <Form.Group controlId="profilePhoto" className="mb-3">
            <Form.Label>Select Image</Form.Label>
            <Form.Control
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <div className="preview-container">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="Preview"
                  className="image-preview"
                />
              </div>
            )}
          </Form.Group>
          <Button variant="primary" type="submit" disabled={!selectedFile && !name}>
            Update
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

ProfileModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string,
    profilePhoto: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  token: PropTypes.string.isRequired,
  updateUser: PropTypes.func.isRequired,
};

export default ProfileModal;