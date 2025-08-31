import { create } from 'zustand';
import { User, Person } from '../types';
import { MockAPIHandler } from '../api/MockAPIHandler';

interface AuthState {
  // State
  currentUser: User | null;
  currentPerson: Person | null;
  isAuthenticated: boolean;
  userType: 'PARENTAL' | 'PERSON' | null;
  isLoading: boolean;
  error: string | null;

  // API handler
  apiHandler: MockAPIHandler;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, phone: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  setCurrentPerson: (person: Person) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  currentUser: null,
  currentPerson: null,
  isAuthenticated: false,
  userType: null,
  isLoading: false,
  error: null,

  // API handler
  apiHandler: new MockAPIHandler(),

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await get().apiHandler.login(email, password);

      if (response.success && response.data) {
        set({
          currentUser: response.data,
          isAuthenticated: true,
          userType: response.data.userType,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.error || 'Login failed',
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred during login',
      });
      return false;
    }
  },

  register: async (email: string, phone: string, password: string, name: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await get().apiHandler.register(email, phone, password, name);

      if (response.success && response.data) {
        set({
          currentUser: response.data,
          isAuthenticated: true,
          userType: response.data.userType,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.error || 'Registration failed',
        });
        return false;
      }
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'An error occurred during registration',
      });
      return false;
    }
  },

  logout: () => {
    get().apiHandler.logout();
    set({
      currentUser: null,
      currentPerson: null,
      isAuthenticated: false,
      userType: null,
      error: null,
    });
  },

  setCurrentPerson: (person: Person) => {
    set({ currentPerson: person });
  },

  clearError: () => {
    set({ error: null });
  },
}));
