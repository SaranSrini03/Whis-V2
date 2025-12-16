// Minimal Firebase auth context to surface the signed-in user.
import { useEffect, useState, createContext, useContext } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { firebaseApp } from "./firebase";

const auth = getAuth(firebaseApp);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

// Provide the Firebase user object to React tree consumers.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);

    return () => unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}
