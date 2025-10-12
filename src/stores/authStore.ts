import { create } from 'zustand';
import { Person, Parental } from '../types';
import { APIFactory } from '../api/APIFactory';
import { AuthUtil } from '../utils/authUtil';
import { reownConnectAuthService, Web3AuthState } from '../services/web3AuthService';
import { WalletConnection } from '../types/web3';

interface AuthState {
    // State - Multi-tenant architecture
    currentUser: Parental | null; // Always the parent/tenant admin
    activePerson: Person | null; // Currently active child profile
    isAuthenticated: boolean;
    viewMode: 'parent' | 'child'; // Current view mode
    isLoading: boolean;
    error: string | null;
    isInitialized: boolean; // Track if auth check is complete

    // Web3 authentication state
    web3AuthState: Web3AuthState | null;
    boundWallet: WalletConnection | null; // Additional wallet for social/email users

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

    // Web3 authentication actions
    web3Login: () => Promise<boolean>;
    bindWallet: () => Promise<boolean>;
    web3Logout: () => Promise<void>;
    getWalletConnection: () => WalletConnection | null;
}

// Create API handler once outside the store to prevent recreation
const apiHandler = APIFactory.createAPIHandler();

export const useAuthStore = create<AuthState>((set, get) => ({
    // Initial state
    currentUser: null,
    activePerson: null,
    isAuthenticated: false,
    viewMode: 'parent',
    isLoading: false,
    error: null,
    isInitialized: false,

    // Web3 authentication state
    web3AuthState: null,
    boundWallet: null,

    // API handler - use the singleton instance
    apiHandler,

    // Initialize auth from local storage using AuthUtil
    initializeAuth: async () => {
        set({ isLoading: true });

        try {
            const authData = AuthUtil.initializeAuth();

            set({
                currentUser: authData.parent,
                activePerson: authData.activePerson,
                isAuthenticated: authData.isAuthenticated,
                viewMode: authData.viewMode,
                isInitialized: true,
                isLoading: false,
            });
        } catch (error) {
            console.error('Auth initialization failed:', error);
            set({
                currentUser: null,
                activePerson: null,
                isAuthenticated: false,
                viewMode: 'parent',
                isInitialized: true,
                isLoading: false,
                error: error instanceof Error ? error.message : 'Authentication initialization failed',
            });
        }
    },

    // Login with email and password
    login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
            const { apiHandler } = get();
            const response = await apiHandler.login(email, password);

            if (response.errcode === '200' && response.data) {
                const { user, token } = response.data;

                // Store auth data using AuthUtil
                AuthUtil.storeAuthData(token, user, 'parent');

                set({
                    currentUser: user as Parental,
                    activePerson: null,
                    isAuthenticated: true,
                    viewMode: 'parent',
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
            console.error('Login error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Login failed',
            });
            return false;
        }
    },

    // Register new parent account
    register: async (email: string, phone: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        try {
            const { apiHandler } = get();
            const response = await apiHandler.register(email, phone, password, name);

            if (response.errcode === '200' && response.data) {
                const { user, token } = response.data;

                // Store auth data using AuthUtil
                AuthUtil.storeAuthData(token, user, 'parent');

                set({
                    currentUser: user as Parental,
                    activePerson: null,
                    isAuthenticated: true,
                    viewMode: 'parent',
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
            console.error('Registration error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Registration failed',
            });
            return false;
        }
    },

    // Logout and clear all auth data
    logout: async () => {
        set({ isLoading: true });

        try {
            const { apiHandler } = get();
            await apiHandler.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear auth data using AuthUtil
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

    // Switch to child view
    switchToPerson: (person: Person) => {
        const { currentUser } = get();
        if (!currentUser) return;

        // Store the switch using AuthUtil
        // Note: Person is no longer a User, so we need to handle this differently
        // For now, we'll store the person ID separately
        localStorage.setItem('kidsviewer_active_person_id', person.id.toString());
        AuthUtil.storeAuthData(AuthUtil.getCurrentToken() || '', currentUser, 'child');

        set({
            activePerson: person,
            viewMode: 'child',
        });
    },

    // Switch back to parent view
    switchToParent: () => {
        // Store the switch using AuthUtil
        AuthUtil.storeActivePerson(null);
        AuthUtil.storeAuthData(AuthUtil.getCurrentToken() || '', get().currentUser!, 'parent');

        set({
            activePerson: null,
            viewMode: 'parent',
        });
    },

    // Clear error state
    clearError: () => {
        set({ error: null });
    },

    // Refresh persons list
    refreshPersons: async () => {
        const { currentUser, apiHandler } = get();
        if (!currentUser) return;

        set({ isLoading: true, error: null });

        try {
            const response = await apiHandler.getPersons(currentUser.id.toString());

            if (response.errcode === '200' && response.data) {
                const updatedParent = { ...currentUser, persons: response.data };

                // Update stored auth data
                AuthUtil.storeAuthData(AuthUtil.getCurrentToken() || '', updatedParent, get().viewMode);

                set({
                    currentUser: updatedParent,
                    isLoading: false,
                });
            } else {
                set({
                    isLoading: false,
                    error: response.errmsg || 'Failed to refresh persons',
                });
            }
        } catch (error) {
            console.error('Refresh persons error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Failed to refresh persons',
            });
        }
    },

    // Web3 authentication methods
    web3Login: async () => {
        set({ isLoading: true, error: null });

        try {
            const authState = await reownConnectAuthService.openAuthModal();

            if (authState) {
                // Create a mock user for Web3 authentication
                const mockUser: Parental = {
                    id: 1,
                    email: authState.email || authState.address || 'web3-user@kidsviewer.app',
                    phone: '',
                    name: authState.socialProvider ?
                        `${authState.socialProvider.charAt(0).toUpperCase() + authState.socialProvider.slice(1)} User` :
                        'Web3 User',
                    password: '', // No password for Web3 auth
                    persons: [],
                    rewardConfig: {
                        enabled: false,
                        tokenType: 'USDC',
                        rewardPerAnswer: 0.1,
                        dailyLimit: 10,
                        settlementMode: 'realtime',
                    },
                    piggyBankConfig: {
                        enabled: false,
                        investmentPercentage: 50,
                        dailyMaxInvestment: 100,
                        cumulativeMaxInvestment: 1000,
                        defiEnabled: false,
                        approvedAaveProducts: [],
                    },
                };

                // Store Web3 auth data
                localStorage.setItem('kidsviewer_web3_auth', JSON.stringify(authState));
                AuthUtil.storeAuthData('web3-token', mockUser, 'parent');

                set({
                    currentUser: mockUser,
                    activePerson: null,
                    isAuthenticated: true,
                    viewMode: 'parent',
                    web3AuthState: authState,
                    isLoading: false,
                    error: null,
                });

                return true;
            } else {
                set({
                    isLoading: false,
                    error: 'Web3 authentication failed',
                });
                return false;
            }
        } catch (error) {
            console.error('Web3 login error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Web3 login failed',
            });
            return false;
        }
    },

    bindWallet: async () => {
        set({ isLoading: true, error: null });

        try {
            const walletConnection = await reownConnectAuthService.bindWallet();

            if (walletConnection) {
                // Store bound wallet
                localStorage.setItem('kidsviewer_bound_wallet', JSON.stringify(walletConnection));

                set({
                    boundWallet: walletConnection,
                    isLoading: false,
                    error: null,
                });

                return true;
            } else {
                set({
                    isLoading: false,
                    error: 'Wallet binding failed',
                });
                return false;
            }
        } catch (error) {
            console.error('Wallet binding error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Wallet binding failed',
            });
            return false;
        }
    },

    web3Logout: async () => {
        set({ isLoading: true });

        try {
            await reownConnectAuthService.signOut();

            // Clear Web3 auth data
            localStorage.removeItem('kidsviewer_web3_auth');
            localStorage.removeItem('kidsviewer_bound_wallet');
            AuthUtil.clearAuthData();

            set({
                currentUser: null,
                activePerson: null,
                isAuthenticated: false,
                viewMode: 'parent',
                web3AuthState: null,
                boundWallet: null,
                isLoading: false,
                error: null,
                isInitialized: true,
            });
        } catch (error) {
            console.error('Web3 logout error:', error);
            set({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Web3 logout failed',
            });
        }
    },

    getWalletConnection: () => {
        const { web3AuthState, boundWallet } = get();

        // Return bound wallet if available, otherwise return primary wallet
        if (boundWallet) {
            return boundWallet;
        }

        if (web3AuthState?.isConnected) {
            return {
                address: web3AuthState.address!,
                chainId: web3AuthState.chainId!,
                isConnected: true,
                walletId: web3AuthState.walletId,
            };
        }

        return null;
    },
}));
