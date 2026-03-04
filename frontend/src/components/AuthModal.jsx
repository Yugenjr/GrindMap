import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);

  if (!isOpen) return null;

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        {isLogin ? (
          <Login onToggle={toggleMode} />
        ) : (
          <Signup onToggle={toggleMode} />
        )}
      </div>
    </div>
  );
};

export default AuthModal;