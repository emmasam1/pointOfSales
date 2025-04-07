import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthConfigContext = createContext();

const AuthConfigProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [baseUrl, setBaseUrl] = useState('https://trademate-bn9u.onrender.com/api');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = JSON.parse(sessionStorage.getItem('user'));
    const storedBaseUrl = sessionStorage.getItem('baseUrl');
    
    if (storedToken) {
      setToken(storedToken);
    }
    
    if (storedUser) {
      setUser(storedUser);
    }

    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  const saveToken = (userToken, userData) => {
    sessionStorage.setItem('token', userToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
  };

  const saveBaseUrl = (url) => {
    sessionStorage.setItem('baseUrl', url);
    setBaseUrl(url); 
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('baseUrl'); 
    setToken(null);
    setBaseUrl('https://trademate-bn9u.onrender.com/api'); 
    setUser(null);
  };

  return (
    <AuthConfigContext.Provider value={{ token, user, baseUrl, saveToken, saveBaseUrl, logout }}>
      {children}
    </AuthConfigContext.Provider>
  );
};

const useAuthConfig = () => {
  const context = useContext(AuthConfigContext);
  if (!context) {
    throw new Error('useAuthConfig must be used within an AuthConfigProvider');
  }
  return context;
};

export { AuthConfigProvider, useAuthConfig };
