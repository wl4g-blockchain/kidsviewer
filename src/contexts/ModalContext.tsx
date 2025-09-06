import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  showPasswordModal: boolean;
  setShowPasswordModal: (show: boolean) => void;
  parentalPassword: string;
  setParentalPassword: (password: string) => void;
  passwordError: string;
  setPasswordError: (error: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [parentalPassword, setParentalPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  return (
    <ModalContext.Provider
      value={{
        showPasswordModal,
        setShowPasswordModal,
        parentalPassword,
        setParentalPassword,
        passwordError,
        setPasswordError,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};
