// Auth context: the logged-in user, plus login, sign-up and logout (PS-1, PS-2).
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export const homePathFor = (user) => (user.role === 'CUSTOMER' ? '/portal' : '/');

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  const logout = useCallback(() => {
    tokenStore.set(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (tokenStore.get()) {
      api('/auth/me')
        .then((data) => setUser(data.user))
        .catch(logout)
        .finally(() => setLoading(false));
    }
    window.addEventListener('auth:expired', logout);
    return () => window.removeEventListener('auth:expired', logout);
  }, [logout]);

  const signIn = async (path, body) => {
    const { token, user: signedInUser } = await api(path, { method: 'POST', body });
    tokenStore.set(token);
    setUser(signedInUser);
    return signedInUser;
  };

  const value = {
    user,
    loading,
    logout,
    login: (body) => signIn('/auth/login', body),
    register: (body) => signIn('/auth/register', body),
    isAdmin: user?.role === 'ADMIN',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
