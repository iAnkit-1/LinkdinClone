import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// The API_BASE logic has been corrected to point to the base URL /api,
// and the /auth endpoint is built from it.
const API_BASE = 'https://linkdinclone-1.onrender.com/api';
const API_AUTH_URL = `${API_BASE}/auth`; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userName = localStorage.getItem('userName');
        // CRITICAL: Load user ID for Edit/Delete functionality
        const userId = localStorage.getItem('userId'); 

        if (token && userName && userId) {
            // Set user with all necessary properties
            setUser({ name: userName, token, id: userId }); 
        }
        setLoading(false);
    }, []);

    const register = async (name, email, password) => {
        try {
            const res = await axios.post(`${API_AUTH_URL}/register`, { name, email, password });
            
            // Save token, name, and ID from the backend response
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userName', res.data.name);
            localStorage.setItem('userId', res.data.id); // <-- NEW: Store user ID
            
            setUser({ name: res.data.name, token: res.data.token, id: res.data.id }); // <-- NEW: Set user ID
            
            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.msg || 'Registration failed.';
            return { success: false, error: errorMessage };
        }
    };

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${API_AUTH_URL}/login`, { email, password });
            
            // Save token, name, and ID from the backend response
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('userName', res.data.name);
            localStorage.setItem('userId', res.data.id); // <-- NEW: Store user ID
            
            setUser({ name: res.data.name, token: res.data.token, id: res.data.id }); // <-- NEW: Set user ID

            return { success: true };
        } catch (err) {
            const errorMessage = err.response?.data?.msg || 'Login failed.';
            return { success: false, error: errorMessage };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId'); // <-- NEW: Remove user ID
        setUser(null);
    };

    const contextValue = {
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
        getToken: () => localStorage.getItem('token') 
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
