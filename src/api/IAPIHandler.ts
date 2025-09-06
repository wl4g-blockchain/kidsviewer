import { User, Person, Question, ApiResponse, AppSettings, WatchingSessionResponse, WatchingStatusResponse } from '../types';

// Base API handler interface
export interface IAPIHandler {
  // Authentication
  register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>>;
  login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>>;
  logout(): Promise<ApiResponse<void>>;

  // User management
  getCurrentUser(): Promise<ApiResponse<User>>;
  updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>>;

  // Parental operations
  createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>>;
  getPersons(parentalId: string): Promise<ApiResponse<Person[]>>;
  updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>>;

  // Parental control password verification
  verifyParentalPassword(password: string): Promise<ApiResponse<boolean>>;

  // Person operations
  getPerson(personId: string): Promise<ApiResponse<Person>>;
  updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>>;

  // Person accessible URLs - get platform name, difficulty, max daily time etc.
  getPersonAccessibleUrls(personId: string): Promise<
    ApiResponse<
      {
        platformName: string;
        url: string;
        difficulty: string;
        maxDailyTime: number;
        description?: string;
      }[]
    >
  >;

  // Watching control APIs
  startWatching(personId: string, platformUrl: string): Promise<ApiResponse<WatchingSessionResponse>>;
  checkWatching(watchingToken: string): Promise<ApiResponse<WatchingStatusResponse>>;
  verifyQuestion(
    watchingToken: string,
    questionId: string,
    answer: string
  ): Promise<ApiResponse<{ code: number; correct: boolean; newWatchingToken?: string }>>;

  // Questions
  getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>>;
  submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>>;

  // Statistics and Progress
  getDailyReport(personId: string, date: string): Promise<ApiResponse<Person['statistics']>>;
  getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>>;
  getWatchingHistory(
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
  >;

  // Settings
  getAppSettings(): Promise<ApiResponse<AppSettings>>;
  updateAppSettings(settings: Partial<AppSettings>): Promise<ApiResponse<AppSettings>>;
}
