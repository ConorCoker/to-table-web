import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CategoryForm.css';

const CategoryForm = ({ restaurantId }) => {
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch existing categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(`/api/${restaurantId}/categories`);
                setCategories(response.data);
            } catch (error) {
                setMessage('Error fetching categories');
            }
        };
        fetchCategories();
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`/api/${restaurantId}/categories`, {
                name: categoryName,
            });
            setMessage(response.data.message);
            setCategoryName('');
            // Refresh categories
            const updatedCategories = await axios.get(`/api/${restaurantId}/categories`);
            setCategories(updatedCategories.data);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error adding category');
        }
    };

    return (
        <div className="category-form">
            <h2>Manage Categories</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Category Name:</label>
                    <input
                        type="text"
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Add Category</button>
            </form>
            {message && <p>{message}</p>}
            <h3>Existing Categories</h3>
            {categories.length > 0 ? (
                <ul>
                    {categories.map((category) => (
                        <li key={category.id}>{category.name}</li>
                    ))}
                </ul>
            ) : (
                <p>No categories found.</p>
            )}
        </div>
    );
};

export default CategoryForm;