import { IAPIHandler } from './IAPIHandler';
import { MockAPIHandler } from './MockAPIHandler';
import { StandardAPIHandler } from './StandardAPIHandler';

/**
 * API Factory to create appropriate API handler based on environment
 */
export class APIFactory {
  /**
   * Create API handler instance based on environment configuration
   */
  static createAPIHandler(): IAPIHandler {
    // Simple environment detection for demo purposes
    // In production, you would use proper environment configuration
    const isDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port !== '';

    // For now, always use Mock API for development/demo
    const useMockAPI = true; // Change this to false when you have a real backend
    const apiBaseURL = '/api/v1';
    const apiKey = undefined;

    // Use mock handler in development or when explicitly configured
    if (isDevelopment || useMockAPI) {
      console.log('🔧 Using Mock API Handler for development/demo');
      return new MockAPIHandler();
    }

    // Use standard handler for production
    console.log('🌐 Using Standard API Handler for production');
    return new StandardAPIHandler(apiBaseURL, apiKey);
  }

  /**
   * Get current API handler type for debugging
   */
  static getAPIHandlerType(): 'mock' | 'standard' {
    const isDevelopment =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.port !== '';
    const useMockAPI = true; // Same as above

    return isDevelopment || useMockAPI ? 'mock' : 'standard';
  }
}
