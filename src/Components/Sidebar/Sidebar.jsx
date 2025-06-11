import PropTypes from 'prop-types';
import './Sidebar.css';

function Sidebar({ setShowSidebar, setShowModal, setModalRole }) {
  const openAdminLogin = () => {
    setModalRole('admin');
    setShowModal(true);
    setShowSidebar(false);
  };

  return (
    <div className="sidebar-overlay">
      <div className="sidebar">
        <button className="close-btn" onClick={() => setShowSidebar(false)}>×</button>
        <h3>Menu</h3>
        <ul className="sidebar-links">
          <li>
            <button onClick={openAdminLogin} className="sidebar-button">
              <i className="fas fa-user-shield"></i> Admin Login
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

Sidebar.propTypes = {
  setShowSidebar: PropTypes.func.isRequired,
  setShowModal: PropTypes.func.isRequired,
  setModalRole: PropTypes.func.isRequired,
};

export default Sidebar;