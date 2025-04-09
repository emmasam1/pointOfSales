import React, { createContext, useState, useEffect, useContext } from 'react';
import CryptoJS from 'crypto-js'; // Import the crypto-js library

const AuthConfigContext = createContext();

// Secret key for encryption/decryption (should be kept safe and ideally not hardcoded in production)
const SECRET_KEY = 'mySecretKey';

const AuthConfigProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [baseUrl, setBaseUrl] = useState('https://trademate-bn9u.onrender.com/api');
  const [user, setUser] = useState(null);

  // Helper functions for encryption and decryption
  const encryptData = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  };

  const decryptData = (encryptedData) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  };

  useEffect(() => {
    const storedToken = sessionStorage.getItem('token');
    const storedUser = sessionStorage.getItem('user');
    const storedBaseUrl = sessionStorage.getItem('baseUrl');
    
    if (storedToken) {
      const decryptedToken = decryptData(storedToken);
      setToken(decryptedToken);
    }

    if (storedUser) {
      const decryptedUser = decryptData(storedUser);
      setUser(decryptedUser);
    }

    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  const saveToken = (userToken, userData) => {
    const encryptedToken = encryptData(userToken);
    const encryptedUser = encryptData(userData);

    sessionStorage.setItem('token', encryptedToken);
    sessionStorage.setItem('user', encryptedUser);
    sessionStorage.setItem('baseUrl', baseUrl);

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
