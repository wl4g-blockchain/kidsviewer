import { IAPIHandler } from './IAPIHandler';
import { MockAPIHandler } from './MockAPIHandler';
import { StandardAPIHandler } from './StandardAPIHandler';

export class APIFactory {
  private static _apiHandler: IAPIHandler | null = null;

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

    if (APIFactory._apiHandler) {
      console.debug('🔧 Returning existing API Handler instance.');
      return APIFactory._apiHandler;
    }

    // Use mock handler in development or when explicitly configured
    if (isDevelopment || useMockAPI) {
      console.debug('🔧 Using Mock API Handler for development/demo');
      APIFactory._apiHandler = new MockAPIHandler();
      return APIFactory._apiHandler;
    }

    // Use standard handler for production
    console.debug('🌐 Using Standard API Handler for production');
    APIFactory._apiHandler = new StandardAPIHandler(apiBaseURL, apiKey);
    return APIFactory._apiHandler;
  }
}
