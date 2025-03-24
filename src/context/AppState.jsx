import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthConfigContext = createContext();

const AuthConfigProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [baseUrl, setBaseUrl] = useState('https://trademate-bn9u.onrender.com/api');

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedBaseUrl = sessionStorage.getItem('baseUrl');
    
    if (storedToken) {
      setToken(storedToken);
    }
    
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  const saveToken = (userToken) => {
    sessionStorage.setItem('token', userToken);
    setToken(userToken);
  };

  const saveBaseUrl = (url) => {
    sessionStorage.setItem('baseUrl', url);
    setBaseUrl(url); 
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('baseUrl'); 
    setToken(null);
    setBaseUrl('https://trademate-bn9u.onrender.com/api'); 
  };

  return (
    <AuthConfigContext.Provider value={{ token, baseUrl, saveToken, saveBaseUrl, logout }}>
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
