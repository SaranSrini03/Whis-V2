// lib/auth.js
import { useEffect, useState, createContext, useContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from './firebase'; // Import your Firebase app initialization

const auth = getAuth(firebaseApp); // Initialize Firebase Authentication

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext); // Custom hook to access user data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser); // Set the user when authentication state changes

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user }}>
      {children}
    </AuthContext.Provider>
  );
}
