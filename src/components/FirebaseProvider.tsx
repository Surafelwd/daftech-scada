import React, { createContext, useContext, useState } from "react";

interface AuthContextType {
  user: any | null;
  role: string | null;
  loading: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: false,
  isAuthReady: true,
});

export const useAuth = () => useContext(AuthContext);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Dummy user since the system bypasses Firebase
  const [user] = useState({
    uid: "dummy-123",
    displayName: "Admin User",
    email: "admin@daftech.local",
    photoURL: ""
  });
  const [role] = useState("admin");

  return (
    <AuthContext.Provider value={{ user, role, loading: false, isAuthReady: true }}>
      {children}
    </AuthContext.Provider>
  );
};
