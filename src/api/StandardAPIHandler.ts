import { IAPIHandler } from './IAPIHandler';
import { User, Person, Question, ApiResponse, AppSettings, WatchingSessionResponse, WatchingStatusResponse } from '../types';

/**
 * Standard API Handler for Production Environment
 * This implementation calls real backend APIs instead of using mock data
 */
export class StandardAPIHandler implements IAPIHandler {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = '/api/v1', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Helper method to make authenticated API calls
   */
  private async apiCall<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // Add API key if available
      if (this.apiKey) {
        (headers as any)['X-API-Key'] = this.apiKey;
      }

      // Add JWT token from localStorage if available
      const token = localStorage.getItem('kidsviewer_jwt_token');
      if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ errmsg: 'Network error' }));
        return {
          errcode: response.status.toString(),
          errmsg: errorData.errmsg || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        errcode: '200',
        errmsg: 'ok',
        data,
      };
    } catch (error) {
      return {
        errcode: '5000',
        errmsg: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Authentication APIs
  async register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, phone, password, name }),
    });
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.apiCall('/auth/logout', {
      method: 'POST',
    });
  }

  // User management APIs
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.apiCall('/user/me');
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    return this.apiCall(`/user/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Parental operations
  async createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>> {
    return this.apiCall('/persons', {
      method: 'POST',
      body: JSON.stringify({ parentalId, ...personData }),
    });
  }

  async getPersons(parentalId: string): Promise<ApiResponse<Person[]>> {
    return this.apiCall(`/persons?parentalId=${parentalId}`);
  }

  async updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>> {
    return this.apiCall(`/persons/${personId}/settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  // Parental control password verification
  async verifyParentalPassword(password: string): Promise<ApiResponse<boolean>> {
    return this.apiCall('/auth/verify-parental-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // Person operations
  async getPerson(personId: string): Promise<ApiResponse<Person>> {
    return this.apiCall(`/persons/${personId}`);
  }

  async updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>> {
    return this.apiCall(`/persons/${personId}/statistics`, {
      method: 'PUT',
      body: JSON.stringify(statistics),
    });
  }

  // Person accessible URLs
  async getPersonAccessibleUrls(personId: string): Promise<
    ApiResponse<
      {
        platformName: string;
        url: string;
        difficulty: string;
        maxDailyTime: number;
        description?: string;
      }[]
    >
  > {
    return this.apiCall(`/persons/${personId}/accessible-urls`);
  }

  // Watching control APIs
  async startWatching(personId: string, platformUrl: string): Promise<ApiResponse<WatchingSessionResponse>> {
    return this.apiCall('/watching/start', {
      method: 'POST',
      body: JSON.stringify({ personId, platformUrl }),
    });
  }

  async checkWatching(watchingToken: string): Promise<ApiResponse<WatchingStatusResponse>> {
    return this.apiCall('/watching/check', {
      method: 'POST',
      body: JSON.stringify({ watchingToken }),
    });
  }

  async verifyQuestion(
    watchingToken: string,
    questionId: string,
    answer: string
  ): Promise<
    ApiResponse<{
      code: number;
      correct: boolean;
      newWatchingToken?: string;
    }>
  > {
    return this.apiCall('/watching/verify-question', {
      method: 'POST',
      body: JSON.stringify({ watchingToken, questionId, answer }),
    });
  }

  // Questions
  async getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>> {
    const params = new URLSearchParams({
      subjects: subjects.join(','),
      difficulty,
      count: count.toString(),
    });
    return this.apiCall(`/questions?${params}`);
  }

  async submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>> {
    return this.apiCall('/questions/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ questionId, answer, isCorrect }),
    });
  }

  // Statistics and Progress
  async getDailyReport(personId: string, date: string): Promise<ApiResponse<Person['statistics']>> {
    return this.apiCall(`/statistics/daily-report?personId=${personId}&date=${date}`);
  }

  async getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>> {
    return this.apiCall(`/statistics/learning-progress?personId=${personId}`);
  }

  async getWatchingHistory(
    personId: string,
    days?: number
  ): Promise<
    ApiResponse<
      {
        date: string;
        platform: string;
        watchedMinutes: number;
        questionsAnswered: number;
        questionsCorrect: number;
      }[]
    >
  > {
    const params = new URLSearchParams({ personId });
    if (days !== undefined) {
      params.append('days', days.toString());
    }
    return this.apiCall(`/statistics/watching-history?${params}`);
  }

  // Settings
  async getAppSettings(): Promise<ApiResponse<AppSettings>> {
    return this.apiCall('/settings');
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
    return this.apiCall('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}
