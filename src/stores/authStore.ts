import { create } from 'zustand';
import { Person, Parental } from '../types';
import { APIFactory } from '../api/APIFactory';
import { AuthUtil } from '../utils/authUtil';

interface AuthState {
  // State - Multi-tenant architecture
  currentUser: Parental | null; // Always the parent/tenant admin
  activePerson: Person | null; // Currently active child profile
  isAuthenticated: boolean;
  viewMode: 'parent' | 'child'; // Current view mode
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean; // Track if auth check is complete

  // API handler
  apiHandler: ReturnType<typeof APIFactory.createAPIHandler>;

  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, phone: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  switchToPerson: (person: Person) => void;
  switchToParent: () => void;
  clearError: () => void;
  refreshPersons: () => Promise<void>;
  initializeAuth: () => Promise<void>; // Initialize auth from storage
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  currentUser: null,
  activePerson: null,
  isAuthenticated: false,
  viewMode: 'parent',
  isLoading: false,
  error: null,
  isInitialized: false,

  // API handler
  apiHandler: APIFactory.createAPIHandler(),

  // Initialize auth from local storage using AuthUtil
  initializeAuth: async () => {
    set({ isLoading: true });

    try {
      const authData = AuthUtil.initializeAuth();

      set({
        currentUser: authData.user as Parental | null,
        activePerson: authData.activePerson as Person | null,
        isAuthenticated: authData.isAuthenticated,
        viewMode: authData.viewMode,
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    } catch (error) {
      // Clear any corrupted data
      AuthUtil.clearAuthData();

      set({
        currentUser: null,
        activePerson: null,
        isAuthenticated: false,
        viewMode: 'parent',
        isLoading: false,
        error: null,
        isInitialized: true,
      });
    }
  },

  // Actions
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await get().apiHandler.login(email, password);

      if (response.errcode === '200' && response.data) {
        const { user, token } = response.data;

        // Only allow parental users to login
        if (user.userType !== 'PARENTAL') {
          set({
            isLoading: false,
            error: 'This app is designed for parent accounts only',
          });
          return false;
        }

        const parentalUser = user as Parental;

        // Store authentication data using AuthUtil
        AuthUtil.storeAuthData(token, parentalUser, 'parent');

        set({
          currentUser: parentalUser,
          isAuthenticated: true,
          viewMode: 'parent',
          activePerson: null,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.errmsg || 'Login failed',
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

      if (response.errcode === '200' && response.data) {
        const { user, token } = response.data;
        const parentalUser = user as Parental;

        // Store authentication data using AuthUtil
        AuthUtil.storeAuthData(token, parentalUser, 'parent');

        set({
          currentUser: parentalUser,
          isAuthenticated: true,
          viewMode: 'parent',
          activePerson: null,
          isLoading: false,
          error: null,
        });
        return true;
      } else {
        set({
          isLoading: false,
          error: response.errmsg || 'Registration failed',
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

  logout: async () => {
    try {
      // Call API logout
      await get().apiHandler.logout();

      // Clear authentication data using AuthUtil
      AuthUtil.clearAuthData();

      set({
        currentUser: null,
        activePerson: null,
        isAuthenticated: false,
        viewMode: 'parent',
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Even if API call fails, clear local state
      AuthUtil.clearAuthData();

      set({
        currentUser: null,
        activePerson: null,
        isAuthenticated: false,
        viewMode: 'parent',
        isLoading: false,
        error: null,
      });
    }
  },

  // Switch to child view mode
  switchToPerson: (person: Person) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      const token = AuthUtil.getCurrentToken();
      if (token) {
        AuthUtil.storeAuthData(token, currentUser, 'child');
        AuthUtil.storeActivePerson(person);
      }
    }

    set({
      activePerson: person,
      viewMode: 'child',
    });
  },

  // Switch back to parent view mode
  switchToParent: () => {
    const currentUser = get().currentUser;
    if (currentUser) {
      const token = AuthUtil.getCurrentToken();
      if (token) {
        AuthUtil.storeAuthData(token, currentUser, 'parent');
        AuthUtil.storeActivePerson(null);
      }
    }

    set({
      activePerson: null,
      viewMode: 'parent',
    });
  },

  // Refresh persons list from current user
  refreshPersons: async () => {
    const { currentUser, apiHandler } = get();
    if (currentUser) {
      try {
        const response = await apiHandler.getPersons(currentUser.id);
        if (response.errcode === '200' && response.data) {
          // Update the current user's persons array
          const updatedUser = {
            ...currentUser,
            persons: response.data,
          };

          // Update localStorage
          localStorage.setItem('kidsviewer_user', JSON.stringify(updatedUser));

          set({
            currentUser: updatedUser,
          });
        }
      } catch (error) {
        console.error('Failed to refresh persons:', error);
      }
    }
  },

  clearError: () => {
    set({ error: null });
  },
}));
