import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import MenuForm from './components/MenuForm';
import CategoryForm from './components/CategoryForm';
import Register from './components/Register';
import Login from './components/Login';
import BrowseRestaurants from './components/BrowseRestaurants';
import RestaurantPage from './components/RestaurantPage';
import EditRestaurant from './components/EditRestaurant';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import './App.css';
import RoleForm from './components/RoleForm';

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

    const handleLogout = async () => {
        try {
            await signOut(auth);
            // Redirect handled by AuthContext (user will be null)
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <div className="App">
            {/* Top Navigation Bar */}
            <nav className="top-nav">
                <div className="nav-left">
                    <Link to="/">TooTable</Link>
                </div>
                <div className="nav-right">
                    {user ? (
                        <div className="account-menu">
                            <span className="account-label">Account</span>
                            <div className="dropdown">
                                <Link to="/add-menu">Add Menu Item</Link>
                                <Link to="/categories">Manage Categories</Link>
                                <Link to="/roles">Manage Roles</Link>
                                <Link to="/edit">Edit Restaurant</Link>
                                <button onClick={handleLogout}>Logout</button>
                            </div>
                        </div>
                    ) : (
                        <Link to="/login">Login</Link>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<BrowseRestaurants />} />
                <Route path="/restaurants/:restaurantId" element={<RestaurantPage />} />
                <Route
                    path="/add-menu"
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
                <Route
                    path="/roles"
                    element={
                        <ProtectedRoute>
                            <AuthContext.Consumer>
                                {({ restaurantId }) => <RoleForm restaurantId={restaurantId} />}
                            </AuthContext.Consumer>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/edit"
                    element={
                        <ProtectedRoute>
                            <EditRestaurant />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div>
    );
};

export default App;