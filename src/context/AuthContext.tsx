import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAdminAuthenticated: boolean;
  loginAdmin: (password: string, note?: string) => boolean;
  logoutAdmin: () => void;
  adminNote: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('isAdminAuth') === 'true';
  });
  const [adminNote, setAdminNote] = useState(() => {
    return localStorage.getItem('adminNote') || '';
  });

  const loginAdmin = (password: string, note?: string) => {
    if (password === '51535759') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('isAdminAuth', 'true');
      if (note) {
         setAdminNote(note);
         localStorage.setItem('adminNote', note);
      }
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminNote('');
    localStorage.removeItem('isAdminAuth');
    localStorage.removeItem('adminNote');
  };

  return (
    <AuthContext.Provider value={{ isAdminAuthenticated, loginAdmin, logoutAdmin, adminNote }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
