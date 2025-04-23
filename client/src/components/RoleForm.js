import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './RoleForm.css';

const RoleForm = ({ restaurantId }) => {
    const [roleName, setRoleName] = useState('');
    const [message, setMessage] = useState('');
    const [roles, setRoles] = useState([]);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get(`${apiUrl}/api/${restaurantId}/roles`);
                setRoles(response.data || []);
            } catch (error) {
                setMessage('Error fetching roles: ' + (error.response?.data?.message || error.message));
                console.error('Fetch roles error:', error);
            }
        };

        if (restaurantId) {
            fetchRoles();
        }
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            setMessage('Role name is required');
            return;
        }

        try {
            const response = await axios.post(`${apiUrl}/api/${restaurantId}/roles`, { name: roleName });
            setMessage(response.data.message);
            setRoleName('');
            const updatedRoles = await axios.get(`${apiUrl}/api/${restaurantId}/roles`);
            setRoles(updatedRoles.data || []);
        } catch (error) {
            setMessage(error.response?.data?.message || 'Error creating role');
            console.error('Create role error:', error);
        }
    };

    return (
        <div className="role-form">
            <h2>Add Role for Restaurant</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Role Name:</label>
                    <input
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="e.g., Kitchen"
                        required
                    />
                </div>
                <button type="submit">Create Role</button>
            </form>
            {message && <p>{message}</p>}
            <div className="existing-roles">
                <h3>Existing Roles</h3>
                {roles.length === 0 ? (
                    <p>No roles found. Add a role above.</p>
                ) : (
                    <ul>
                        {roles.map((role) => (
                            <li key={role.id}>
                                {role.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default RoleForm;