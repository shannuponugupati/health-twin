import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../App';

const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    const [isAdmin, setIsAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdmin = async () => {
            if (!user) {
                setIsAdmin(false);
                setLoading(false);
                return;
            }

            try {
                const adminDoc = await getDoc(doc(db, 'admins', user.uid));
                setIsAdmin(adminDoc.exists());
            } catch (err) {
                console.error('Error checking admin status:', err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        };

        checkAdmin();
    }, [user]);

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="processing-orb" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/admin/login" />;
    }

    return children;
};

export default AdminRoute;
