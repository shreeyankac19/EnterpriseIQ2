import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types/index.ts';
import { api, tokenStorage } from '../api/client.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  demoUsers: User[];
  login: (username: string, password?: string) => Promise<User>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  toggleRole: () => void;
  canAccess: (confidentiality?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  useEffect(() => {
    // Load available users
    api.getUsers()
      .then(res => {
        setDemoUsers(res.users);
        const stored = tokenStorage.get();
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch {
            // Default to first user (Admin - Eleanor Vance)
            if (res.users.length > 0) {
              setUser(res.users[0]);
              tokenStorage.set(res.users[0]);
            }
          }
        } else if (res.users.length > 0) {
          // Default Eleanor Vance (Admin)
          setUser(res.users[0]);
          tokenStorage.set(res.users[0]);
        }
      })
      .catch(err => {
        console.error('Failed to load demo users:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (username: string, password?: string): Promise<User> => {
    const res = await api.login(username, password);
    setUser(res.user);
    tokenStorage.set(res.user);
    return res.user;
  };

  const logout = () => {
    tokenStorage.remove();
    setUser(null);
  };

  const switchUser = (targetUser: User) => {
    setUser(targetUser);
    tokenStorage.set(targetUser);
  };

  const toggleRole = () => {
    if (!user) return;
    const targetRole: UserRole = user.role === 'admin' ? 'employee' : 'admin';
    const match = demoUsers.find(u => u.role === targetRole);
    if (match) {
      switchUser(match);
    } else {
      const updated: User = {
        ...user,
        role: targetRole,
        name: targetRole === 'admin' ? 'Eleanor Vance' : 'Alex Rivera',
        department: targetRole === 'admin' ? 'Executive' : 'Operations',
        avatar_initial: targetRole === 'admin' ? 'E' : 'A'
      };
      setUser(updated);
      tokenStorage.set(updated);
    }
  };

  const canAccess = (confidentiality: string = 'Internal'): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return confidentiality.toLowerCase() === 'internal';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        demoUsers,
        login,
        logout,
        switchUser,
        toggleRole,
        canAccess
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
