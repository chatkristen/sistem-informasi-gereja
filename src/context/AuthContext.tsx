'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, RoleCode } from '@/lib/types';
import { hasPermission, ActionType, ModuleName, ROLES } from '@/lib/rbac';

interface AuthContextType {
  currentUser: User | null;
  roleCode: RoleCode;
  isLoading: boolean;
  switchRole: (role: RoleCode) => void;
  can: (module: ModuleName, action: ActionType) => boolean;
  logout: () => void;
  availableUsers: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<RoleCode, Partial<User>> = {
  SUPER_ADMIN: {
    id: 'u1000000-0000-0000-0000-000000000001',
    role_code: 'SUPER_ADMIN',
    role_name: 'Super Admin',
    username: 'admin',
    full_name: 'Pdt. Samuel Hartono, M.Th',
    email: 'admin@gkka.org',
    status: 'ACTIVE',
  },
  PENDETA: {
    id: 'u1000000-0000-0000-0000-000000000002',
    role_code: 'PENDETA',
    role_name: 'Gembala / Pendeta',
    username: 'pendeta',
    full_name: 'Pdt. Andreas Wicaksono, M.Div',
    email: 'andreas.wicaksono@gkka.org',
    status: 'ACTIVE',
  },
  SEKRETARIS: {
    id: 'u1000000-0000-0000-0000-000000000003',
    role_code: 'SEKRETARIS',
    role_name: 'Sekretaris Gereja',
    username: 'sekretaris',
    full_name: 'Debora Santoso, S.Kom',
    email: 'debora.santoso@gkka.org',
    status: 'ACTIVE',
  },
  BENDAHARA: {
    id: 'u1000000-0000-0000-0000-000000000004',
    role_code: 'BENDAHARA',
    role_name: 'Bendahara Gereja',
    username: 'bendahara',
    full_name: 'Lydia Kusuma, S.E., Ak.',
    email: 'lydia.kusuma@gkka.org',
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
    status: 'ACTIVE',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read cached role or default to SUPER_ADMIN
    const savedRole = (localStorage.getItem('church_active_role') as RoleCode) || 'SUPER_ADMIN';
    const initialUser: User = {
      ...(DEMO_USERS[savedRole] as User),
      church_id: 'c1000000-0000-0000-0000-000000000001',
      role_id: 'r-' + savedRole,
    };
    setCurrentUser(initialUser);
    setIsLoading(false);
  }, []);

  const switchRole = (newRole: RoleCode) => {
    localStorage.setItem('church_active_role', newRole);
    const updatedUser: User = {
      ...(DEMO_USERS[newRole] as User),
      church_id: 'c1000000-0000-0000-0000-000000000001',
      role_id: 'r-' + newRole,
    };
    setCurrentUser(updatedUser);
  };

  const logout = () => {
    switchRole('SUPER_ADMIN');
  };

  const can = (module: ModuleName, action: ActionType): boolean => {
    if (!currentUser) return false;
    return hasPermission(currentUser.role_code, module, action);
  };

  const roleCode: RoleCode = currentUser?.role_code || 'SUPER_ADMIN';

  const availableUsers = Object.values(DEMO_USERS) as User[];

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        roleCode,
        isLoading,
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
