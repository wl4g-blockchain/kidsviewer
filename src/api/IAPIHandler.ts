import { User, Parental, Person, Question, ApiResponse } from '../types'

// Base API handler interface
export interface IAPIHandler {
  // Authentication
  register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<User>>
  login(email: string, password: string): Promise<ApiResponse<User>>
  logout(): Promise<ApiResponse<void>>
  
  // User management
  getCurrentUser(): Promise<ApiResponse<User>>
  updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>>
  
  // Parental operations
  createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>>
  getPersons(parentalId: string): Promise<ApiResponse<Person[]>>
  updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>>
  
  // Person operations
  getPerson(personId: string): Promise<ApiResponse<Person>>
  updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>>
  
  // Questions
  getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>>
  submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>>
  
  // Statistics
  getDailyReport(personId: string, date: string): Promise<ApiResponse<Person['statistics']>>
  getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>>
  
  // Settings
  getAppSettings(): Promise<ApiResponse<any>>
  updateAppSettings(settings: any): Promise<ApiResponse<any>>
  
  // Data persistence
  saveData(): Promise<ApiResponse<void>>
  loadData(): Promise<ApiResponse<any>>
  clearData(): Promise<ApiResponse<void>>
} 