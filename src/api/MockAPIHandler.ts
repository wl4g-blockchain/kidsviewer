import { IAPIHandler } from './IAPIHandler'
import { User, Parental, Person, Question, ApiResponse } from '../types'

// Question bank for different subjects and difficulties
const questionBank = {
  math: {
    easy: [
      {
        type: 'calculation' as const,
        content: 'What is 7 + 5?',
        correctAnswer: 12,
        explanation: '7 + 5 = 12'
      },
      {
        type: 'calculation' as const,
        content: 'What is 9 - 3?',
        correctAnswer: 6,
        explanation: '9 - 3 = 6'
      },
      {
        type: 'calculation' as const,
        content: 'What is 4 × 6?',
        correctAnswer: 24,
        explanation: '4 × 6 = 24'
      },
      {
        type: 'multiple-choice' as const,
        content: 'Which number comes after 15?',
        options: ['14', '16', '17', '18'],
        correctAnswer: '16',
        explanation: 'The number after 15 is 16'
      },
      {
        type: 'calculation' as const,
        content: 'What is 10 + 2?',
        correctAnswer: 12,
        explanation: '10 + 2 = 12'
      }
    ],
    medium: [
      {
        type: 'calculation' as const,
        content: 'What is 18 ÷ 3?',
        correctAnswer: 6,
        explanation: '18 ÷ 3 = 6'
      },
      {
        type: 'calculation' as const,
        content: 'What is 25 - 8?',
        correctAnswer: 17,
        explanation: '25 - 8 = 17'
      },
      {
        type: 'calculation' as const,
        content: 'What is 5 × 7?',
        correctAnswer: 35,
        explanation: '5 × 7 = 35'
      },
      {
        type: 'calculation' as const,
        content: 'What is 12 + 15?',
        correctAnswer: 27,
        explanation: '12 + 15 = 27'
      },
      {
        type: 'calculation' as const,
        content: 'What is 32 ÷ 4?',
        correctAnswer: 8,
        explanation: '32 ÷ 4 = 8'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What is half of 26?',
        options: ['12', '13', '14', '15'],
        correctAnswer: '13',
        explanation: 'Half of 26 is 13'
      }
    ],
    hard: [
      {
        type: 'calculation' as const,
        content: 'What is 4 × 5 + 3?',
        correctAnswer: 23,
        explanation: '4 × 5 = 20, then 20 + 3 = 23'
      },
      {
        type: 'calculation' as const,
        content: 'What is 36 ÷ 4 + 2?',
        correctAnswer: 11,
        explanation: '36 ÷ 4 = 9, then 9 + 2 = 11'
      },
      {
        type: 'calculation' as const,
        content: 'What is 15 × 3 - 7?',
        correctAnswer: 38,
        explanation: '15 × 3 = 45, then 45 - 7 = 38'
      },
      {
        type: 'calculation' as const,
        content: 'What is 48 ÷ 6 + 5?',
        correctAnswer: 13,
        explanation: '48 ÷ 6 = 8, then 8 + 5 = 13'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What is 3² + 4?',
        options: ['7', '9', '13', '15'],
        correctAnswer: '13',
        explanation: '3² = 9, then 9 + 4 = 13'
      }
    ]
  },
  chinese: {
    easy: [
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：壹',
        options: ['1', '2', '3', '4'],
        correctAnswer: '1',
        explanation: '壹 = 1 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：贰',
        options: ['1', '2', '3', '4'],
        correctAnswer: '2',
        explanation: '贰 = 2 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：叁',
        options: ['1', '2', '3', '4'],
        correctAnswer: '3',
        explanation: '叁 = 3 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：肆',
        options: ['3', '4', '5', '6'],
        correctAnswer: '4',
        explanation: '肆 = 4 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：伍',
        options: ['3', '4', '5', '6'],
        correctAnswer: '5',
        explanation: '伍 = 5 (大写数字)'
      }
    ],
    medium: [
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：陆',
        options: ['4', '5', '6', '7'],
        correctAnswer: '6',
        explanation: '陆 = 6 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：柒',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        explanation: '柒 = 7 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：捌',
        options: ['6', '7', '8', '9'],
        correctAnswer: '8',
        explanation: '捌 = 8 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：玖',
        options: ['7', '8', '9', '10'],
        correctAnswer: '9',
        explanation: '玖 = 9 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：拾',
        options: ['8', '9', '10', '11'],
        correctAnswer: '10',
        explanation: '拾 = 10 (大写数字)'
      }
    ],
    hard: [
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：佰',
        options: ['50', '100', '150', '200'],
        correctAnswer: '100',
        explanation: '佰 = 100 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：仟',
        options: ['500', '1000', '1500', '2000'],
        correctAnswer: '1000',
        explanation: '仟 = 1000 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：万',
        options: ['5000', '10000', '15000', '20000'],
        correctAnswer: '10000',
        explanation: '万 = 10000 (大写数字)'
      },
      {
        type: 'multiple-choice' as const,
        content: '识别大写数字：亿',
        options: ['100000', '1000000', '100000000', '1000000000'],
        correctAnswer: '100000000',
        explanation: '亿 = 100000000 (大写数字)'
      }
    ]
  },
  english: {
    easy: [
      {
        type: 'multiple-choice' as const,
        content: 'What time is it now?',
        options: ['Morning', 'Afternoon', 'Evening', 'Night'],
        correctAnswer: getCurrentTimeAnswer(),
        explanation: 'Based on current time'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What day is today?',
        options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        correctAnswer: getCurrentDayAnswer(),
        explanation: 'Based on current day'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What color is the sky?',
        options: ['Blue', 'Green', 'Red', 'Yellow'],
        correctAnswer: 'Blue',
        explanation: 'The sky is usually blue during the day'
      },
      {
        type: 'multiple-choice' as const,
        content: 'How many fingers do you have?',
        options: ['8', '9', '10', '11'],
        correctAnswer: '10',
        explanation: 'You have 10 fingers (5 on each hand)'
      }
    ],
    medium: [
      {
        type: 'multiple-choice' as const,
        content: 'What month is it now?',
        options: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        correctAnswer: getCurrentMonthAnswer(),
        explanation: 'Based on current month'
      },
      {
        type: 'true-false' as const,
        content: 'Is it a weekday today?',
        correctAnswer: isWeekday(),
        explanation: 'Weekdays are Monday to Friday'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What is the opposite of "big"?',
        options: ['Large', 'Small', 'Huge', 'Giant'],
        correctAnswer: 'Small',
        explanation: 'The opposite of "big" is "small"'
      },
      {
        type: 'multiple-choice' as const,
        content: 'How many days are in a week?',
        options: ['5', '6', '7', '8'],
        correctAnswer: '7',
        explanation: 'There are 7 days in a week'
      }
    ],
    hard: [
      {
        type: 'fill-blank' as const,
        content: 'Complete: "Today is ___"',
        correctAnswer: getCurrentDayAnswer(),
        explanation: 'Fill in the current day'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What season is it now?',
        options: ['Spring', 'Summer', 'Autumn', 'Winter'],
        correctAnswer: getCurrentSeasonAnswer(),
        explanation: 'Based on current season'
      },
      {
        type: 'multiple-choice' as const,
        content: 'What is the capital of England?',
        options: ['Manchester', 'Liverpool', 'London', 'Birmingham'],
        correctAnswer: 'London',
        explanation: 'London is the capital of England'
      },
      {
        type: 'true-false' as const,
        content: 'The sun rises in the east',
        correctAnswer: true,
        explanation: 'Yes, the sun rises in the east and sets in the west'
      }
    ]
  }
}

// Helper functions for dynamic questions
function getCurrentTimeAnswer(): string {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 12) return 'Morning'
  if (hour >= 12 && hour < 17) return 'Afternoon'
  if (hour >= 17 && hour < 21) return 'Evening'
  return 'Night'
}

function getCurrentDayAnswer(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[new Date().getDay()]
}

function getCurrentMonthAnswer(): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return months[new Date().getMonth()]
}

function isWeekday(): boolean {
  const day = new Date().getDay()
  return day >= 1 && day <= 5
}

function getCurrentSeasonAnswer(): string {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Autumn'
  return 'Winter'
}

// Generate questions based on subjects, difficulty, and count
function generateQuestions(subjects: string[], difficulty: string, count: number): Question[] {
  const questions: Question[] = []
  const availableQuestions: any[] = []

  // Collect all available questions from specified subjects and difficulty
  subjects.forEach(subject => {
    if (questionBank[subject as keyof typeof questionBank] && questionBank[subject as keyof typeof questionBank][difficulty as keyof typeof questionBank.math]) {
      availableQuestions.push(...questionBank[subject as keyof typeof questionBank][difficulty as keyof typeof questionBank.math])
    }
  })

  // Shuffle and select questions
  const shuffled = shuffleArray([...availableQuestions])
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length))

  // Convert to Question interface format
  selectedQuestions.forEach((q, index) => {
    const question: Question = {
      id: `q_${Date.now()}_${index}`,
      type: q.type,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      content: q.content,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      language: 'en' // Default to English, can be made configurable
    }
    questions.push(question)
  })

  return questions
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Local storage API handler for offline/desktop use
export class MockAPIHandler implements IAPIHandler {
  private storageKey = 'kidsviewer_data'
  private currentUser: User | null = null

  constructor() {
    this.loadData()
  }

  // Authentication
  async register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<User>> {
    try {
      const existingData = this.getStoredData()
      const existingUser = existingData.users?.find((u: any) => u.email === email)
      
      if (existingUser) {
        return { success: false, error: 'User already exists' }
      }

      const newUser: Parental = {
        id: this.generateId(),
        email,
        phone,
        name,
        userType: 'PARENTAL',  
        controlPassword: password,
        persons: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }

      existingData.users = existingData.users || []
      existingData.users.push(newUser)
      this.currentUser = newUser
      
      await this.saveData()
      return { success: true, data: newUser }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const existingData = this.getStoredData()
      const user = existingData.users?.find((u: any) => u.email === email)
      
      if (!user) {
        return { success: false, error: 'User not found' }
      }

      if (user.userType === 'parental' && (user as Parental).controlPassword !== password) {
        return { success: false, error: 'Invalid password' }
      }

      this.currentUser = user
      return { success: true, data: user }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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
      const userIndex = existingData.users?.findIndex((u: any) => u.id === userId)
      
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
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Parental operations
  async createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>> {
    try {
      const existingData = this.getStoredData()
      const parental = existingData.users?.find((u: any) => u.id === parentalId && u.userType === 'parental') as Parental
      
      if (!parental) {
        return { success: false, error: 'Parental not found' }
      }

      const newPerson: Person = {
        id: this.generateId(),
        parentalId,
        userType: 'PERSON',
        email: `${personData.alias}@kidsviewer.local`,
        name: personData.alias || 'Person',
        alias: personData.alias || 'Person',
        ageGroup: personData.ageGroup || 'young',
        settings: {
          timeLimit: personData.settings?.timeLimit || 15,
          questionCount: personData.settings?.questionCount || 3,
          subjects: personData.settings?.subjects || [
            { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
            { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' }
          ],
          allowedUrls: personData.settings?.allowedUrls || []
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

      existingData.users.push(newPerson)
      parental.persons.push(newPerson)
      
      await this.saveData()
      return { success: true, data: newPerson }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getPersons(parentalId: string): Promise<ApiResponse<Person[]>> {
    try {
      const existingData = this.getStoredData()
      const persons = existingData.users?.filter((u: any) => u.parentalId === parentalId && u.userType === 'child') as Person[]
      return { success: true, data: persons }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>> {
    try {
      const existingData = this.getStoredData()
      const personIndex = existingData.users?.findIndex((u: any) => u.id === personId && u.userType === 'child')
      
      if (personIndex === -1) {
        return { success: false, error: 'Person not found' }
      }

      const person = existingData.users[personIndex] as Person
      person.settings = { ...person.settings, ...settings }
      person.updatedAt = new Date()

      await this.saveData()
      return { success: true, data: person }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Person operations
  async getPerson(personId: string): Promise<ApiResponse<Person>> {
    try {
      const existingData = this.getStoredData()
      const person = existingData.users?.find((u: any) => u.id === personId && u.userType === 'child') as Person
      
      if (!person) {
        return { success: false, error: 'Person not found' }
      }

      return { success: true, data: person }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>> {
    try {
      const existingData = this.getStoredData()
      const personIndex = existingData.users?.findIndex((u: any) => u.id === personId && u.userType === 'child')
      
      if (personIndex === -1) {
        return { success: false, error: 'Person not found' }
      }

      const person = existingData.users[personIndex] as Person
      person.statistics = { ...person.statistics, ...statistics }
      person.updatedAt = new Date()

      await this.saveData()
      return { success: true, data: person }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Questions
  async getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>> {
    try {
      const questions = generateQuestions(subjects, difficulty, count)
      return { success: true, data: questions }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async submitAnswer(questionId: string, answer: string | number, isCorrect: boolean): Promise<ApiResponse<void>> {
    // This would typically update statistics, but for now just return success
    return { success: true }
  }

  // Statistics
  async getDailyReport(personId: string, date: string): Promise<ApiResponse<Person['statistics']>> {
    try {
      const person = await this.getPerson(personId)
      if (!person.success || !person.data) {
        return { success: false, error: 'Person not found' }
      }
      return { success: true, data: person.data.statistics }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>> {
    try {
      const person = await this.getPerson(personId)
      if (!person.success || !person.data) {
        return { success: false, error: 'Person not found' }
      }
      return { success: true, data: person.data.statistics.learningProgress }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Settings
  async getAppSettings(): Promise<ApiResponse<any>> {
    try {
      const existingData = this.getStoredData()
      return { success: true, data: existingData.settings || {} }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async updateAppSettings(settings: any): Promise<ApiResponse<any>> {
    try {
      const existingData = this.getStoredData()
      existingData.settings = { ...existingData.settings, ...settings }
      await this.saveData()
      return { success: true, data: existingData.settings }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  // Data persistence
  async saveData(): Promise<ApiResponse<void>> {
    try {
      const existingData = this.getStoredData()
      localStorage.setItem(this.storageKey, JSON.stringify(existingData))
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  }

  async clearData(): Promise<ApiResponse<void>> {
    try {
      localStorage.removeItem(this.storageKey)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
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