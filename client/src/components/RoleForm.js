import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './RoleForm.css';

const RoleForm = ({ restaurantId }) => {
    const [roleName, setRoleName] = useState('');
    const [message, setMessage] = useState('');
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchRoles = async () => {
            if (!restaurantId) return;

            try {
                setLoading(true);
                const rolesRef = collection(db, `restaurants/${restaurantId}/roles`);
                const snapshot = await getDocs(rolesRef);
                const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRoles(rolesData || []);
            } catch (error) {
                setMessage('Error fetching roles: ' + error.message);
                console.error('Fetch roles error:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRoles();
    }, [restaurantId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!roleName.trim()) {
            setMessage('Role name is required');
            return;
        }

        try {
            setLoading(true);
            const rolesRef = collection(db, `restaurants/${restaurantId}/roles`);
            const newRole = {
                name: roleName,
                timestamp: new Date(),
            };
            const docRef = await addDoc(rolesRef, newRole);
            setMessage('Role created successfully!');
            setRoleName('');
            // Refresh roles
            const snapshot = await getDocs(rolesRef);
            const rolesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoles(rolesData || []);
        } catch (error) {
            setMessage('Error creating role: ' + error.message);
            console.error('Create role error:', error);
        } finally {
            setLoading(false);
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
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Role'}
                </button>
            </form>
            {message && <p>{message}</p>}
            <div className="existing-roles">
                <h3>Existing Roles</h3>
                {loading ? (
                    <p>Loading roles...</p>
                ) : roles.length === 0 ? (
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