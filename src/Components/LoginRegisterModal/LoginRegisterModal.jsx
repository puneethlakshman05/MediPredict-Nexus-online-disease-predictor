import React, { useState } from 'react';
import { Button, Form, Modal, Alert } from 'react-bootstrap';
import { v4 as uuidv4 } from 'uuid'; // Import UUID
import './LoginRegisterModal.css'; // Import your custom CSS file

function LoginRegisterModal({ role, onLoginSuccess, onClose }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Register

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form states
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerSpecialization, setRegisterSpecialization] = useState('');
  const [registerError, setRegisterError] = useState('');

  // Handle Login Logic
  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError(''); // Reset error message

    const existingUsers = JSON.parse(localStorage.getItem(`${role}s`)) || [];
    const user = existingUsers.find(
      (u) => u.email === loginEmail && u.password === loginPassword
    );

    if (user) {
      alert(`${capitalize(role)} login successful!`);
      onLoginSuccess({ role, name: user.name || null, id: user.id || null });
      onClose(); // Close the modal on successful login
    } else {
      setLoginError('Invalid email or password!');
    }
  };

  // Handle Registration Logic
  const handleRegister = (e) => {
    e.preventDefault();
    setRegisterError(''); // Reset error message

    // Validate Passwords
    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match!');
      return;
    }

    const existingUsers = JSON.parse(localStorage.getItem(`${role}s`)) || [];

    // Check for existing email
    const existingEmail = existingUsers.find((user) => user.email === registerEmail);
    if (existingEmail) {
      setRegisterError('Email already exists!');
      return;
    }

    // Create new user
    const newUser = {
      id: uuidv4(), // Unique ID for each user
      name: registerName,
      email: registerEmail,
      password: registerPassword,
      specialization: role === 'doctor' ? registerSpecialization : null, // Only save specialization for Doctors
    };

    // Save new user to local storage
    localStorage.setItem(`${role}s`, JSON.stringify([...existingUsers, newUser]));
    alert(`${capitalize(role)} registered successfully!`);
    setIsLogin(true); // Switch to login after successful registration
  };

  const capitalize = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  return (
    <Modal show onHide={onClose}>
      <Modal.Header closeButton>
        <Modal.Title>{isLogin ? `Login as ${capitalize(role)}` : `Register as ${capitalize(role)}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLogin ? (
          <Form onSubmit={handleLogin}>
            <Form.Group controlId="formLoginEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="formLoginPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </Form.Group>

            {loginError && <Alert variant="danger">{loginError}</Alert>}

            <Button variant="primary" type="submit">Login</Button>
            <Button variant="link" onClick={() => setIsLogin(false)}>Register</Button>
          </Form>
        ) : (
          <Form onSubmit={handleRegister}>
            <Form.Group controlId="formRegisterName">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter your name"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="formRegisterEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="formRegisterPassword">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group controlId="formRegisterConfirmPassword">
              <Form.Label>Confirm Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirm Password"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            {/* Specialization field only for Doctor role */}
            {role === 'doctor' && (
              <Form.Group controlId="formRegisterSpecialization">
                <Form.Label>Specialization</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your specialization"
                  value={registerSpecialization}
                  onChange={(e) => setRegisterSpecialization(e.target.value)}
                  required
                />
              </Form.Group>
            )}

            {registerError && <Alert variant="danger">{registerError}</Alert>}

            <Button variant="primary" type="submit">Register</Button>
            <Button variant="link" onClick={() => setIsLogin(true)}>Login</Button>
          </Form>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default LoginRegisterModal;
