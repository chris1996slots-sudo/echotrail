import { createContext, useContext } from 'react';
import { useEchoTrailStorage } from '../hooks/useLocalStorage';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const storage = useEchoTrailStorage();

  return (
    <AppContext.Provider value={storage}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
