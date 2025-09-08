import {
  User,
  Person,
  Question,
  Platform,
  QuestionTemplate,
  ApiResponse,
  AppSettings,
  AppInfo,
  WatchingSessionResponse,
  WatchingStatusResponse,
} from '../types';

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
  deletePerson(personId: string): Promise<ApiResponse<void>>;

  // Parental control password verification
  verifyParentalPassword(password: string): Promise<ApiResponse<boolean>>;

  // Person operations
  getPerson(personId: string): Promise<ApiResponse<Person>>;
  updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>>;

  // Person accessible URLs - get platform information
  getPersonPlatforms(personId: string): Promise<
    ApiResponse<
      {
        platformId: string;
        platformNameEN: string;
        platformNameCN: string;
        url: string;
        description?: string;
      }[]
    >
  >;

  // Watching control APIs
  startWatching(personId: string, platformId: string): Promise<ApiResponse<WatchingSessionResponse>>;
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

  // App information
  getAppInfo(): Promise<ApiResponse<AppInfo>>;

  // Platform management
  getPlatforms(): Promise<ApiResponse<Platform[]>>;
  createPlatform(platformData: Partial<Platform>): Promise<ApiResponse<Platform>>;
  updatePlatform(platformId: string, platformData: Partial<Platform>): Promise<ApiResponse<Platform>>;
  deletePlatform(platformId: string): Promise<ApiResponse<void>>;

  // Question template management
  getQuestionTemplates(filters?: { subject?: string; difficulty?: string; ageGroup?: string }): Promise<ApiResponse<QuestionTemplate[]>>;
  createQuestionTemplate(templateData: Partial<QuestionTemplate>): Promise<ApiResponse<QuestionTemplate>>;
  updateQuestionTemplate(templateId: string, templateData: Partial<QuestionTemplate>): Promise<ApiResponse<QuestionTemplate>>;
  deleteQuestionTemplate(templateId: string): Promise<ApiResponse<void>>;
}
