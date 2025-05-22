import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store } from './store'; // or './store'
import { loadUser, logout } from './features/auth/authSlice';
import axios from 'axios';
import CompleteProfilePage from './pages/CompleteProfilePage/CompleteProfilePage.js';
import { resetProfileState } from './features/profile/profileSlice'
import DashboardLayout from './components/Dashboard/DashboardLayout';
import DiscoverPage from './pages/DiscoverPage/DiscoverPage';

// --- Components ---
// We'll create these next
import LandingPage from './components/LandingPage/LandingPage';
import AuthModal from './components/AuthModal/AuthModal';
import Navbar from './components/Navbar/Navbar';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading, user } = useSelector((state) => state.auth);
    const token = localStorage.getItem('token');

    console.log('ProtectedRoute - Auth State:', { isAuthenticated, isLoading, hasToken: !!token, isVerified: user?.isVerified });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated && !token) {
        return <Navigate to="/" />;
    }

    // If user is authenticated but not verified, redirect to complete profile
    if (isAuthenticated && user && !user.isVerified) {
        return <Navigate to="/complete-profile" />;
    }

    return children;
};

// Google OAuth Callback Handler
const AuthCallback = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            // We need to fetch user data after getting token from Google
            // The backend /google/callback currently only redirects with token, not user object
            // So, we dispatch loadUser to fetch user details
            dispatch(loadUser()).then((result) => {
                if (result.meta.requestStatus === 'fulfilled') {
                    navigate('/dashboard'); // Or wherever you want to redirect after login
                } else {
                    // Handle error, maybe redirect to login with an error message
                    dispatch(logout()); // Clear potentially bad token
                    navigate('/');
                }
            });
        } else {
            // No token, redirect to home or login
            navigate('/');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, location.search, navigate]);

    return <div>Loading...</div>; // Or a spinner
};


// Main App Logic
function AppContent() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, token } = useSelector((state) => state.auth);
    const [showAuthModal, setShowAuthModal] = useState(null);

    useEffect(() => {
        // Load user if token exists and user not loaded
        if (token && !user && !isAuthenticated) {
            dispatch(loadUser()).then((result) => {
                if (result.meta.requestStatus === 'fulfilled' && result.payload.isVerified) {
                    navigate('/dashboard');
                }
            });
        }
    }, [dispatch, token, user, isAuthenticated, navigate]);

    useEffect(() => {
        // Handle routing based on authentication and verification status
        if (isAuthenticated && user) {
            if (!user.isVerified && location.pathname !== '/complete-profile' && location.pathname !== '/auth-callback') {
                navigate('/complete-profile', { replace: true });
            } else if (user.isVerified && location.pathname === '/complete-profile') {
                navigate('/dashboard', { replace: true });
            } else if (user.isVerified && location.pathname === '/') {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [isAuthenticated, user, navigate, location.pathname]);

    const handleLogout = () => {
        dispatch(logout());
        dispatch(resetProfileState());
        navigate('/');
    };

    return (
        <>
            <Navbar
                isAuthenticated={isAuthenticated}
                user={user}
                onLoginClick={() => setShowAuthModal('login')}
                onSignupClick={() => setShowAuthModal('signup')}
                onLogoutClick={handleLogout}
            />
            {showAuthModal && (
                <AuthModal
                    mode={showAuthModal}
                    onClose={() => setShowAuthModal(null)}
                    onSwitchMode={(mode) => setShowAuthModal(mode)}
                />
            )}
            <Routes>
                <Route 
                    path="/" 
                    element={
                        isAuthenticated && user?.isVerified 
                            ? <Navigate to="/dashboard" replace /> 
                            : <LandingPage onSignupClick={() => setShowAuthModal('signup')} />
                    } 
                />
                <Route path="/auth-callback" element={<AuthCallback />} />
                <Route
                    path="/complete-profile"
                    element={
                        isAuthenticated 
                            ? (user?.isVerified 
                                ? <Navigate to="/dashboard" replace />
                                : <CompleteProfilePage />)
                            : <Navigate to="/" />
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<Navigate to="discover" replace />} />
                    <Route path="discover" element={<DiscoverPage />} />
                    <Route path="*" element={<Navigate to="discover" replace />} />
                </Route>
            </Routes>
        </>
    );
}

function App() {
    return (
        <Provider store={store}>
            <Router>
                <AppContent />
            </Router>
        </Provider>
    );
}

export default App;