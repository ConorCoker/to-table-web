import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                const categoriesRef = collection(db, `restaurants/${restaurantId}/categories`);
                const snapshot = await getDocs(categoriesRef);
                const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCategories(categoriesData || []);
            } catch (error) {
                setMessage('Error fetching categories: ' + error.message);
                console.error('Fetch categories error:', error);
            }
        };

        const fetchRoles = async () => {
            try {
                const rolesRef = collection(db, `restaurants/${restaurantId}/roles`);
                const snapshot = await getDocs(rolesRef);
                const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRoles(rolesData || []);
            } catch (error) {
                setMessage('Error fetching roles: ' + error.message);
                console.error('Fetch roles error:', error);
            }
        };

        if (restaurantId) {
            fetchCategories();
            fetchRoles();
        }
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!role) {
            setMessage('Please select a role');
            return;
        }
        if (!category) {
            setMessage('Please select a category');
            return;
        }
        if (!itemName.trim()) {
            setMessage('Item name is required');
            return;
        }
        if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
            setMessage('Valid price is required');
            return;
        }

        try {
            setLoading(true);
            const menuRef = collection(db, `restaurants/${restaurantId}/menu`);
            const newItem = {
                name: itemName,
                description: description || '',
                price: parseFloat(price),
                category,
                role,
                timestamp: new Date(),
            };
            await addDoc(menuRef, newItem);
            setMessage('Menu item added successfully!');
            setItemName('');
            setDescription('');
            setPrice('');
            setCategory('');
            setRole('');
        } catch (error) {
            setMessage('Error adding menu item: ' + error.message);
            console.error('Submit error:', error);
        } finally {
            setLoading(false);
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
                        disabled={loading}
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
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
                        disabled={loading}
                    />
                </div>
                <div>
                    <label>Category:</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        disabled={loading || categories.length === 0}
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
                        disabled={loading || roles.length === 0}
                    >
                        <option value="">Select a role</option>
                        {roles.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.name}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading || roles.length === 0 || categories.length === 0}
                >
                    {loading ? 'Adding...' : 'Add Item'}
                </button>
            </form>
            {message && <p>{message}</p>}
        </div>
    );
};

export default MenuForm;