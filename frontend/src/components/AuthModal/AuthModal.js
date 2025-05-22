import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, clearError } from '../../features/auth/authSlice';
import './AuthModal.css'; // Create this CSS file
import { FcGoogle } from 'react-icons/fc'; // npm install react-icons

const AuthModal = ({ mode, onClose, onSwitchMode }) => {
  const [isLoginMode, setIsLoginMode] = useState(mode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accountType, setAccountType] = useState('Couple'); // Default, or 'Bull'

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  useEffect(() => {
    setIsLoginMode(mode === 'login');
    dispatch(clearError()); // Clear previous errors when modal opens or mode changes
  }, [mode, dispatch]);

  // Effect to handle redirection based on user state
  useEffect(() => {
    if (user && user.isVerified) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());

    if (isLoginMode) {
      const result = await dispatch(loginUser({ email, password }));
      if (result.meta.requestStatus === 'fulfilled') {
        onClose();
        if (result.payload.user.isVerified) {
          navigate('/dashboard');
        }
      }
    } else {
      if (password !== confirmPassword) {
        // Handle password mismatch client-side for better UX
        // Though backend also validates
        alert("Passwords do not match!"); 
        return;
      }
      const result = await dispatch(registerUser({ email, password, accountType }));
      if (result.meta.requestStatus === 'fulfilled') {
        onClose();
      }
    }
  };

  const handleGoogleLogin = () => {
    // Include accountType in the Google OAuth URL
    const googleAuthUrl = isLoginMode 
      ? 'http://localhost:5000/api/auth/google'
      : `http://localhost:5000/api/auth/google?accountType=${accountType}`;
    window.location.href = googleAuthUrl;
  };

  const renderErrorMessages = () => {
    if (!error) return null;
    if (Array.isArray(error)) {
      return (
        <ul className="error-list">
          {error.map((err, index) => (
            <li key={index}>{err.msg}</li>
          ))}
        </ul>
      );
    }
    return <p className="error-message">{error.msg || 'An unknown error occurred'}</p>;
  };


  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{isLoginMode ? 'Login to IntiMate' : 'Join IntiMate'}</h2>
        
        {renderErrorMessages()}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {!isLoginMode && (
            <>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="accountType">I am a:</label>
                <select 
                  id="accountType" 
                  value={accountType} 
                  onChange={(e) => setAccountType(e.target.value)}
                  required
                >
                  <option value="Couple">Couple</option>
                  <option value="Bull">Bull</option>
                  {/* Add other relevant types if necessary */}
                </select>
              </div>
            </>
          )}
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLoginMode ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <div className="divider">OR</div>
        <button onClick={handleGoogleLogin} className="google-button" disabled={isLoading}>
          <FcGoogle size={20} style={{ marginRight: '10px' }} />
          {isLoginMode ? 'Login with Google' : 'Sign Up with Google'}
        </button>
        <p className="switch-mode">
          {isLoginMode ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => onSwitchMode(isLoginMode ? 'signup' : 'login')}>
            {isLoginMode ? 'Sign Up' : 'Login'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
//the end comment