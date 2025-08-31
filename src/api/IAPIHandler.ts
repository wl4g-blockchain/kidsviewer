import { User, Parent, Child, Question, ApiResponse } from '@types'

// Base API handler interface
export interface IAPIHandler {
  // Authentication
  register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<User>>
  login(email: string, password: string): Promise<ApiResponse<User>>
  logout(): Promise<ApiResponse<void>>
  
  // User management
  getCurrentUser(): Promise<ApiResponse<User>>
  updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>>
  
  // Parent operations
  createChild(parentId: string, childData: Partial<Child>): Promise<ApiResponse<Child>>
  getChildren(parentId: string): Promise<ApiResponse<Child[]>>
  updateChildSettings(childId: string, settings: Partial<Child['settings']>): Promise<ApiResponse<Child>>
  
  // Child operations
  getChild(childId: string): Promise<ApiResponse<Child>>
  updateChildStatistics(childId: string, statistics: Partial<Child['statistics']>): Promise<ApiResponse<Child>>
  
  // Questions
  getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>>
  submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>>
  
  // Statistics
  getDailyReport(childId: string, date: string): Promise<ApiResponse<Child['statistics']>>
  getLearningProgress(childId: string): Promise<ApiResponse<Child['statistics']['learningProgress']>>
  
  // Settings
  getAppSettings(): Promise<ApiResponse<any>>
  updateAppSettings(settings: any): Promise<ApiResponse<any>>
  
  // Data persistence
  saveData(): Promise<ApiResponse<void>>
  loadData(): Promise<ApiResponse<any>>
  clearData(): Promise<ApiResponse<void>>
} 