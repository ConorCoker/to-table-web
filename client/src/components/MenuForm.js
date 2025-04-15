import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MenuForm.css';

const MenuForm = ({ restaurantId }) => {
    const [itemName, setItemName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('');
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState('');

    // Fetch categories on mount
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
            const response = await axios.post(`/api/${restaurantId}/menu`, {
                name: itemName,
                description,
                price,
                category,
            });
            setMessage(response.data.message);
            setItemName('');
            setDescription('');
            setPrice('');
            setCategory('');
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error adding menu item');
        }
    };

    return (
        <div className="menu-form">
            <h2>Add Menu Item</h2>
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
                <button type="submit">Add Item</button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default MenuForm;