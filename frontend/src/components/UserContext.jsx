import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../services/api.js";

// Dane zalogowanego użytkownika dostępne w całej aplikacji
const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export const useUser = () => useContext(UserContext);
