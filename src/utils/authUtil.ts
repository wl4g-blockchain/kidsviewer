import { User, Parental, Person } from '../types';

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  userType: 'PARENTAL' | 'PERSON';
  iat: number; // issued at
  exp: number; // expiration time
}

// Storage keys
const STORAGE_KEYS = {
  TOKEN: 'kidsviewer_jwt_token',
  USER: 'kidsviewer_user_data',
  VIEW_MODE: 'kidsviewer_view_mode',
  ACTIVE_PERSON: 'kidsviewer_active_person',
} as const;

/**
 * JWT Authentication Utility Class
 * Handles JWT token validation, parsing, and storage operations
 */
export class AuthUtil {
  /**
   * Parse JWT token and extract payload
   */
  static parseJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(atob(parts[1]));
      return payload as JWTPayload;
    } catch (error) {
      console.error('Failed to parse JWT:', error);
      return null;
    }
  }

  /**
   * Check if JWT token is valid (not expired and properly formatted)
   */
  static isTokenValid(token: string | null): boolean {
    if (!token) {
      return false;
    }

    const payload = this.parseJWT(token);
    if (!payload) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  }

  /**
   * Get current valid JWT token from storage
   */
  static getCurrentToken(): string | null {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (this.isTokenValid(token)) {
      return token;
    }
    // Token is invalid, clear storage
    this.clearAuthData();
    return null;
  }

  /**
   * Get user data from storage if token is valid
   */
  static getCurrentUser(): User | null {
    const token = this.getCurrentToken();
    if (!token) {
      return null;
    }

    try {
      const userData = localStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        return JSON.parse(userData) as User;
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      this.clearAuthData();
    }

    return null;
  }

  /**
   * Store authentication data
   */
  static storeAuthData(token: string, user: User, viewMode: 'parent' | 'child' = 'parent'): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }

  /**
   * Store active person data
   */
  static storeActivePerson(person: User | null): void {
    if (person) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PERSON, JSON.stringify(person));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PERSON);
    }
  }

  /**
   * Get stored view mode
   */
  static getViewMode(): 'parent' | 'child' {
    const viewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE);
    return viewMode === 'child' ? 'child' : 'parent';
  }

  /**
   * Get stored active person
   */
  static getActivePerson(): User | null {
    try {
      const personData = localStorage.getItem(STORAGE_KEYS.ACTIVE_PERSON);
      if (personData) {
        return JSON.parse(personData) as User;
      }
    } catch (error) {
      console.error('Failed to parse active person data:', error);
    }
    return null;
  }

  /**
   * Clear all authentication data from storage
   */
  static clearAuthData(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.VIEW_MODE);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PERSON);
  }

  /**
   * Check if current session is authenticated
   */
  static isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  /**
   * Initialize authentication from storage
   * Returns authentication state
   */
  static initializeAuth(): {
    isAuthenticated: boolean;
    parent: Parental | null;
    viewMode: 'parent' | 'child';
    activePerson: Person | null;
    token: string | null;
  } {
    const token = this.getCurrentToken();
    const user = this.getCurrentUser();
    const viewMode = this.getViewMode();
    const activePerson = this.getActivePerson() as Person | null;
    const isAuthenticated = !!(token && user);

    return {
      isAuthenticated,
      parent: user as Parental | null,
      viewMode,
      activePerson,
      token,
    };
  }
}
