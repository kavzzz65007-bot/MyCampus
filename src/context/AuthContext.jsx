import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext();

const DEMO_USERS = {
  student: {
    email: 'student@campus.edu',
    password: 'password123',
    name: 'Alex Rivera',
    role: 'student',
    department: 'Computer Science',
    room: 'Hostel Block B, Room 204'
  },
  admin: {
    email: 'admin@campus.edu',
    password: 'password123',
    name: 'Dr. Evelyn Vance',
    role: 'admin',
    department: 'Campus Administration',
    room: 'Admin Block Suite 101'
  },
  staff: {
    email: 'facilities@campus.edu',
    password: 'password123',
    name: 'Rajesh Kumar',
    role: 'staff',
    department: 'Electrical & Power Systems',
    room: 'Central Workshop'
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fmc_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('fmc_auth_token') || null);
  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('login'); // 'login' | 'register'

  // If no user initially, default to demo student for immediate interactivity
  useEffect(() => {
    if (!user) {
      quickLogin('student');
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('fmc_user', JSON.stringify(data.user));
      localStorage.setItem('fmc_auth_token', data.token);
      setAuthModalOpen(false);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await api.register(userData);
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('fmc_user', JSON.stringify(data.user));
      localStorage.setItem('fmc_auth_token', data.token);
      setAuthModalOpen(false);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (role = 'student') => {
    const creds = DEMO_USERS[role] || DEMO_USERS.student;
    try {
      await login(creds.email, creds.password);
    } catch (err) {
      // Fallback local state if server is waking up
      const fallbackUser = {
        id: `usr_${role}_1`,
        name: creds.name,
        email: creds.email,
        role: creds.role,
        department: creds.department,
        room: creds.room,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(creds.name)}&backgroundColor=0e8ce9`
      };
      setUser(fallbackUser);
      localStorage.setItem('fmc_user', JSON.stringify(fallbackUser));
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fmc_user');
    localStorage.removeItem('fmc_auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        quickLogin,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        isAdmin: user?.role === 'admin',
        isStaff: user?.role === 'staff' || user?.role === 'admin',
        isStudent: user?.role === 'student'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
