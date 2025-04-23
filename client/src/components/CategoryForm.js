import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './CategoryForm.css';

const CategoryForm = ({ restaurantId }) => {
    const [categoryName, setCategoryName] = useState('');
    const [categories, setCategories] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch existing categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            if (!restaurantId) return;

            try {
                setLoading(true);
                const categoriesRef = collection(db, `restaurants/${restaurantId}/categories`);
                const snapshot = await getDocs(categoriesRef);
                const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCategories(categoriesData || []);
            } catch (error) {
                setMessage('Error fetching categories: ' + error.message);
                console.error('Fetch categories error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCategories();
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!categoryName.trim()) {
            setMessage('Category name is required');
            return;
        }

        try {
            setLoading(true);
            const categoriesRef = collection(db, `restaurants/${restaurantId}/categories`);
            const newCategory = {
                name: categoryName,
                timestamp: new Date(),
            };
            await addDoc(categoriesRef, newCategory);
            setMessage('Category added successfully!');
            setCategoryName('');
            // Refresh categories
            const snapshot = await getDocs(categoriesRef);
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData || []);
        } catch (error) {
            setMessage('Error adding category: ' + error.message);
            console.error('Create category error:', error);
        } finally {
            setLoading(false);
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
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Category'}
                </button>
            </form>
            {message && <p>{message}</p>}
            <h3>Existing Categories</h3>
            {loading ? (
                <p>Loading categories...</p>
            ) : categories.length > 0 ? (
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