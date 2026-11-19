'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleCode } from '@/lib/types';
import { hasPermission, ActionType, ModuleName } from '@/lib/rbac';

interface AuthContextType {
  currentUser: User | null;
  roleCode: RoleCode;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, remember_me?: boolean) => Promise<{ success: boolean; message?: string }>;
  quickLogin: (role: RoleCode) => Promise<{ success: boolean; message?: string }>;
  switchRole: (role: RoleCode) => void;
  can: (module: ModuleName, action: ActionType) => boolean;
  logout: () => Promise<void>;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_USERS: Record<RoleCode, Partial<User>> = {
  SUPER_ADMIN: {
    id: 'u1000000-0000-0000-0000-000000000001',
    role_code: 'SUPER_ADMIN',
    role_name: 'Super Admin',
    username: 'admin',
    full_name: 'Pdt. Samuel Hartono, M.Th',
    email: 'admin@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    status: 'ACTIVE',
  },
  PENDETA: {
    id: 'u1000000-0000-0000-0000-000000000002',
    role_code: 'PENDETA',
    role_name: 'Gembala / Pendeta',
    username: 'pendeta',
    full_name: 'Pdt. Andreas Wicaksono, M.Div',
    email: 'andreas.wicaksono@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'ACTIVE',
  },
  SEKRETARIS: {
    id: 'u1000000-0000-0000-0000-000000000003',
    role_code: 'SEKRETARIS',
    role_name: 'Sekretaris Gereja',
    username: 'sekretaris',
    full_name: 'Debora Santoso, S.Kom',
    email: 'debora.santoso@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    status: 'ACTIVE',
  },
  BENDAHARA: {
    id: 'u1000000-0000-0000-0000-000000000004',
    role_code: 'BENDAHARA',
    role_name: 'Bendahara Gereja',
    username: 'bendahara',
    full_name: 'Lydia Kusuma, S.E., Ak.',
    email: 'lydia.kusuma@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    status: 'ACTIVE',
  },
  KETUA_DEPARTEMEN: {
    id: 'u1000000-0000-0000-0000-000000000005',
    role_code: 'KETUA_DEPARTEMEN',
    role_name: 'Ketua Departemen',
    department_id: 'd1000000-0000-0000-0000-000000000001',
    department_name: 'Komisi Pemuda',
    username: 'ketua.pemuda',
    full_name: 'Daniel Kristianto, S.T.',
    email: 'daniel.kristianto@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    status: 'ACTIVE',
  },
  PENGURUS_DEPARTEMEN: {
    id: 'u1000000-0000-0000-0000-000000000006',
    role_code: 'PENGURUS_DEPARTEMEN',
    role_name: 'Pengurus Komisi',
    department_id: 'd1000000-0000-0000-0000-000000000005',
    department_name: 'Tim Musik dan Pujian',
    username: 'pengurus.musik',
    full_name: 'Jonathan Setiawan',
    email: 'jonathan.setiawan@gkka.org',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    status: 'ACTIVE',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check cached user in localStorage
    try {
      const cachedUserStr = localStorage.getItem('church_auth_user');
      if (cachedUserStr) {
        const parsed = JSON.parse(cachedUserStr);
        setCurrentUser(parsed);
      } else {
        // Check if there was an active role set previously, or default to SUPER_ADMIN for smooth first visit
        const savedRole = localStorage.getItem('church_active_role') as RoleCode | null;
        if (savedRole && DEMO_USERS[savedRole]) {
          const initialUser: User = {
            ...(DEMO_USERS[savedRole] as User),
            church_id: 'c1000000-0000-0000-0000-000000000001',
            role_id: 'r-' + savedRole,
          };
          setCurrentUser(initialUser);
          localStorage.setItem('church_auth_user', JSON.stringify(initialUser));
        } else {
          // If no session found, user is null (will be redirected to /login by MainLayout)
          setCurrentUser(null);
        }
      }
    } catch (e) {
      console.error('Failed to restore session', e);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Standard Login via API
  const login = async (identifier: string, password: string, remember_me?: boolean) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, remember_me }),
      });
      const data = await res.json();

      if (data.success && data.user) {
        setCurrentUser(data.user);
        localStorage.setItem('church_auth_user', JSON.stringify(data.user));
        localStorage.setItem('church_active_role', data.user.role_code);
        return { success: true, message: data.message };
      } else {
        return { success: false, message: data.message || 'Gagal login' };
      }
    } catch (err: any) {
      return { success: false, message: err.message || 'Kesalahan jaringan saat login' };
    }
  };

  // 1-Click Quick Demo Login
  const quickLogin = async (role: RoleCode) => {
    const demo = DEMO_USERS[role];
    if (!demo?.email) return { success: false, message: 'Peran tidak ditemukan' };
    return login(demo.email, 'password123', true);
  };

  // Immediate Role Switcher (for development testing in header)
  const switchRole = (newRole: RoleCode) => {
    localStorage.setItem('church_active_role', newRole);
    const updatedUser: User = {
      ...(DEMO_USERS[newRole] as User),
      church_id: 'c1000000-0000-0000-0000-000000000001',
      role_id: 'r-' + newRole,
    };
    setCurrentUser(updatedUser);
    localStorage.setItem('church_auth_user', JSON.stringify(updatedUser));
  };

  // Logout
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser?.id,
          user_name: currentUser?.full_name,
        }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('church_auth_user');
      localStorage.removeItem('church_active_role');
      setCurrentUser(null);
    }
  };

  const can = (module: ModuleName, action: ActionType): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role_code, module, action);
  };

  const roleCode: RoleCode = currentUser?.role_code || 'SUPER_ADMIN';
  const availableUsers = Object.values(DEMO_USERS) as User[];
  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        roleCode,
        isLoading,
        isAuthenticated,
        login,
        quickLogin,
        switchRole,
        can,
        logout,
        availableUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
