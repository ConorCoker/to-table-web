import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import MenuForm from './components/MenuForm';
import CategoryForm from './components/CategoryForm';
import './App.css';

function App() {
    const restaurantId = 'zWiTgflfIQbYmS8Y9hHw'; // Hardcoded for now

    return (
        <Router>
            <div className="App">
                <h1>Restaurant Menu Management</h1>
                <nav>
                    <Link to="/">Add Menu Item</Link> |{' '}
                    <Link to="/categories">Manage Categories</Link>
                </nav>
                <Routes>
                    <Route path="/" element={<MenuForm restaurantId={restaurantId} />} />
                    <Route path="/categories" element={<CategoryForm restaurantId={restaurantId} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;