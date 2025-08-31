import { IAPIHandler } from './IAPIHandler'
import { User, Parent, Child, Question, ApiResponse } from '@types'
import { generateQuestions } from '@utils/questionGenerator'

// Local storage API handler for offline/desktop use
export class LocalAPIHandler implements IAPIHandler {
  private storageKey = 'kidsviewer_data'
  private currentUser: User | null = null

  constructor() {
    this.loadData()
  }

  // Authentication
  async register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<User>> {
    try {
      const existingData = this.getStoredData()
      const existingUser = existingData.users?.find(u => u.email === email)
      
      if (existingUser) {
        return { success: false, error: 'User already exists' }
      }

      const newUser: Parent = {
        id: this.generateId(),
        email,
        phone,
        name,
        userType: 'parent',
        controlPassword: password,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      existingData.users = existingData.users || []
      existingData.users.push(newUser)
      this.currentUser = newUser
      
      await this.saveData()
      return { success: true, data: newUser }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const existingData = this.getStoredData()
      const user = existingData.users?.find(u => u.email === email)
      
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (user.userType === 'parent' && (user as Parent).controlPassword !== password) {
        return { success: false, error: 'Invalid password' }
      }

      this.currentUser = user
      return { success: true, data: user }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    this.currentUser = null
    return { success: true }
  }

  // User management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (!this.currentUser) {
      return { success: false, error: 'No user logged in' }
    }
    return { success: true, data: this.currentUser }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const existingData = this.getStoredData()
      const userIndex = existingData.users?.findIndex(u => u.id === userId)
      
      if (userIndex === -1) {
        return { success: false, error: 'User not found' }
      }

      existingData.users[userIndex] = {
        ...existingData.users[userIndex],
        ...updates,
        updatedAt: new Date()
      }

      if (this.currentUser?.id === userId) {
        this.currentUser = existingData.users[userIndex]
      }

      await this.saveData()
      return { success: true, data: existingData.users[userIndex] }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Parent operations
  async createChild(parentId: string, childData: Partial<Child>): Promise<ApiResponse<Child>> {
    try {
      const existingData = this.getStoredData()
      const parent = existingData.users?.find(u => u.id === parentId && u.userType === 'parent') as Parent
      
      if (!parent) {
        return { success: false, error: 'Parent not found' }
      }

      const newChild: Child = {
        id: this.generateId(),
        parentId,
        userType: 'child',
        email: `${childData.alias}@kidsviewer.local`,
        name: childData.alias || 'Child',
        alias: childData.alias || 'Child',
        ageGroup: childData.ageGroup || 'young',
        settings: {
          timeLimit: childData.settings?.timeLimit || 15,
          questionCount: childData.settings?.questionCount || 3,
          subjects: childData.settings?.subjects || [
            { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
            { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' }
          ],
          allowedUrls: childData.settings?.allowedUrls || []
        },
        statistics: {
          dailyUsage: [],
          questionStats: {
            totalAnswered: 0,
            totalCorrect: 0,
            accuracyRate: 0,
            subjectPreference: {},
            repeatedQuestions: []
          },
          learningProgress: {
            subjects: {},
            overallScore: 0,
            level: 'beginner'
          }
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      existingData.users.push(newChild)
      parent.children.push(newChild)
      
      await this.saveData()
      return { success: true, data: newChild }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getChildren(parentId: string): Promise<ApiResponse<Child[]>> {
    try {
      const existingData = this.getStoredData()
      const children = existingData.users?.filter(u => u.parentId === parentId && u.userType === 'child') as Child[]
      return { success: true, data: children }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async updateChildSettings(childId: string, settings: Partial<Child['settings']>): Promise<ApiResponse<Child>> {
    try {
      const existingData = this.getStoredData()
      const childIndex = existingData.users?.findIndex(u => u.id === childId && u.userType === 'child')
      
      if (childIndex === -1) {
        return { success: false, error: 'Child not found' }
      }

      const child = existingData.users[childIndex] as Child
      child.settings = { ...child.settings, ...settings }
      child.updatedAt = new Date()

      await this.saveData()
      return { success: true, data: child }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Child operations
  async getChild(childId: string): Promise<ApiResponse<Child>> {
    try {
      const existingData = this.getStoredData()
      const child = existingData.users?.find(u => u.id === childId && u.userType === 'child') as Child
      
      if (!child) {
        return { success: false, error: 'Child not found' }
      }

      return { success: true, data: child }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async updateChildStatistics(childId: string, statistics: Partial<Child['statistics']>): Promise<ApiResponse<Child>> {
    try {
      const existingData = this.getStoredData()
      const childIndex = existingData.users?.findIndex(u => u.id === childId && u.userType === 'child')
      
      if (childIndex === -1) {
        return { success: false, error: 'Child not found' }
      }

      const child = existingData.users[childIndex] as Child
      child.statistics = { ...child.statistics, ...statistics }
      child.updatedAt = new Date()

      await this.saveData()
      return { success: true, data: child }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Questions
  async getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>> {
    try {
      const questions = generateQuestions(subjects, difficulty, count)
      return { success: true, data: questions }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>> {
    // This would typically update statistics, but for now just return success
    return { success: true }
  }

  // Statistics
  async getDailyReport(childId: string, date: string): Promise<ApiResponse<Child['statistics']>> {
    try {
      const child = await this.getChild(childId)
      if (!child.success || !child.data) {
        return { success: false, error: 'Child not found' }
      }
      return { success: true, data: child.data.statistics }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async getLearningProgress(childId: string): Promise<ApiResponse<Child['statistics']['learningProgress']>> {
    try {
      const child = await this.getChild(childId)
      if (!child.success || !child.data) {
        return { success: false, error: 'Child not found' }
      }
      return { success: true, data: child.data.statistics.learningProgress }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Settings
  async getAppSettings(): Promise<ApiResponse<any>> {
    try {
      const existingData = this.getStoredData()
      return { success: true, data: existingData.settings || {} }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async updateAppSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const existingData = this.getStoredData()
      existingData.settings = { ...existingData.settings, ...settings }
      await this.saveData()
      return { success: true, data: existingData.settings }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Data persistence
  async saveData(): Promise<ApiResponse<void>> {
    try {
      const existingData = this.getStoredData()
      localStorage.setItem(this.storageKey, JSON.stringify(existingData))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async loadData(): Promise<ApiResponse<any>> {
    try {
      const data = localStorage.getItem(this.storageKey)
      if (data) {
        const parsedData = JSON.parse(data)
        // Convert date strings back to Date objects
        this.convertDates(parsedData)
        return { success: true, data: parsedData }
      }
      return { success: true, data: { users: [], settings: {} } }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  async clearData(): Promise<ApiResponse<void>> {
    try {
      localStorage.removeItem(this.storageKey)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Helper methods
  private getStoredData() {
    const data = localStorage.getItem(this.storageKey)
    if (data) {
      const parsedData = JSON.parse(data)
      this.convertDates(parsedData)
      return parsedData
    }
    return { users: [], settings: {} }
  }

  private convertDates(obj: any) {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (key === 'createdAt' || key === 'updatedAt' || key === 'startTime' || key === 'endTime' || key === 'lastAttempted') {
          if (typeof obj[key] === 'string') {
            obj[key] = new Date(obj[key])
          }
        } else if (typeof obj[key] === 'object') {
          this.convertDates(obj[key])
        }
      })
    }
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }
} 