import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Person } from '../types';

// Context for managing view mode and active person
interface AppContextType {
  viewMode: 'parent' | 'child';
  setViewMode: (mode: 'parent' | 'child') => void;
  activePerson: Person | null;
  setActivePerson: (person: Person | null) => void;
  switchToPersonView: (person: Person) => void;
  switchToParentView: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// AppProvider component for both Vite and Next.js
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [viewMode, setViewMode] = useState<'parent' | 'child'>('parent');
  const [activePerson, setActivePerson] = useState<Person | null>(null);

  const switchToPersonView = (person: Person) => {
    setActivePerson(person);
    setViewMode('child');
  };

  const switchToParentView = () => {
    setActivePerson(null);
    setViewMode('parent');
  };

  const contextValue: AppContextType = {
    viewMode,
    setViewMode,
    activePerson,
    setActivePerson,
    switchToPersonView,
    switchToParentView,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
