import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { User, UserRole, Event } from '../types';
import { apiLogin, apiLogout } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  updateAuthUser: (user: User) => void;
  switchEvent: (eventId: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, pass: string) => {
    setLoading(true);
    try {
      const loggedInUser = await apiLogin(email, pass);
      setUser(loggedInUser);
      localStorage.setItem('user', JSON.stringify(loggedInUser));
      
      if (loggedInUser.role === UserRole.ADMIN && loggedInUser.isMaster) {
        navigate('/admin/events');
      } else if (loggedInUser.role === UserRole.ORGANIZER && loggedInUser.eventId) {
        navigate(`/admin/event/${loggedInUser.eventId}/dashboard`);
      } else {
        // Fallback for non-master admins or other roles
        navigate('/');
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
    localStorage.removeItem('user');
    sessionStorage.removeItem('checkinInfo');
    navigate('/login');
  }, [navigate]);

  const updateAuthUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const switchEvent = useCallback((eventId: string) => {
    setUser(currentUser => {
        if (!currentUser || currentUser.role !== UserRole.ORGANIZER) {
            return currentUser;
        }

        const newEvent = currentUser.events?.find(e => e.id === eventId);
        if (!newEvent) {
            return currentUser; // Event not found in user's list, do nothing.
        }

        const updatedUser = { ...currentUser, eventId: eventId };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        navigate(`/admin/event/${eventId}/dashboard`);
        return updatedUser;
    });
  }, [navigate]);


  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, updateAuthUser, switchEvent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};