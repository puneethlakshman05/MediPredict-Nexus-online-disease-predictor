import React from 'react';
import { Modal, Button, ListGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import './NotificationModal.css';

function NotificationModal({ show, onHide, notifications, setNotifications, token }) {
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(notifications.map(notif =>
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Notifications</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {notifications.length === 0 ? (
          <p>No notifications available.</p>
        ) : (
          <ListGroup>
            {notifications.map(notification => (
              <ListGroup.Item
                key={notification._id}
                className={notification.read ? 'read' : 'unread'}
              >
                <div className="notification-item">
                  <FontAwesomeIcon
                    icon={notification.status === 'approved' ? faCheckCircle : faTimesCircle}
                    className={notification.status === 'approved' ? 'text-success' : 'text-danger'}
                  />
                  <span className="ms-2">{notification.message}</span>
                  {!notification.read && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => markAsRead(notification._id)}
                      className="ms-auto"
                    >
                      Mark as Read
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default NotificationModal;