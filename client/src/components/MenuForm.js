import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './MenuForm.css';

const MenuForm = ({ restaurantId }) => {
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [role, setRole] = useState('');
    const [categories, setCategories] = useState([]);
    const [roles, setRoles] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`/api/${restaurantId}/categories`);
                setCategories(response.data || []);
            } catch (error) {
                setMessage('Error fetching categories: ' + (error.response?.data?.message || error.message));
                console.error('Fetch categories error:', error);
            }
        };

        const fetchRoles = async () => {
            try {
                const response = await axios.get(`/api/${restaurantId}/roles`);
                setRoles(response.data || []);
            } catch (error) {
                setMessage('Error fetching roles: ' + (error.response?.data?.message || error.message));
                console.error('Fetch roles error:', error);
            }
        };

        fetchCategories();
        fetchRoles();
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!role) {
            setMessage('Please select a role');
            return;
        }

        try {
            const response = await axios.post(`/api/${restaurantId}/menu`, {
                name: itemName,
                description,
                price: parseFloat(price),
                category,
                role,
            });
            setMessage(response.data.message);
            setItemName('');
            setDescription('');
            setPrice('');
            setCategory('');
            setRole('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error adding menu item');
            console.error('Submit error:', error);
        }
    };

    return (
        <div className="menu-form">
            <h2>Add Menu Item</h2>
            {roles.length === 0 && (
                <p className="warning">
                    No roles available. Please <Link to="/roles">add a role</Link> before creating a menu item.
                </p>
            )}
            {categories.length === 0 && (
                <p className="warning">
                    No categories available. Please <Link to="/categories">add a category</Link> before creating a menu item.
                </p>
            )}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Item Name:</label>
                    <input
                        type="text"
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label>Price:</label>
                    <input
                        type="number"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Category:</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                            <option key={cat.id} value={cat.name}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>Role:</label>
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        required
                    >
                        <option value="">Select a role</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button type="submit" disabled={roles.length === 0 || categories.length === 0}>
                    Add Item
                </button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default MenuForm;