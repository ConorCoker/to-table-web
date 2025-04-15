import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import MenuForm from './components/MenuForm';
import CategoryForm from './components/CategoryForm';
import Register from './components/Register';
import Login from './components/Login';
import './App.css';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useContext(AuthContext);
    if (loading) return <div>Loading...</div>;
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

const AppContent = () => {
    const { user } = useContext(AuthContext);

    return (
        <div className="App">
            <h1>Restaurant Menu Management</h1>
            <nav>
                {user ? (
                    <>
                        <Link to="/">Add Menu Item</Link> |{' '}
                        <Link to="/categories">Manage Categories</Link>
                    </>
                ) : (
                    <>
                        <Link to="/login">Login</Link> | <Link to="/register">Register</Link>
                    </>
                )}
            </nav>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AuthContext.Consumer>
                                {({ restaurantId }) => <MenuForm restaurantId={restaurantId} />}
                            </AuthContext.Consumer>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/categories"
                    element={
                        <ProtectedRoute>
                            <AuthContext.Consumer>
                                {({ restaurantId }) => <CategoryForm restaurantId={restaurantId} />}
                            </AuthContext.Consumer>
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
};

export default App;