import { IAPIHandler } from './IAPIHandler';
import { User, Parental, Person, Question, ApiResponse, AppSettings } from '../types';

// Default hardcoded credentials for demo
const DEFAULT_CREDENTIALS = {
  email: 'demo@parent.com',
  password: '123456',
} as const;

// Mock JWT generation for demo purposes
function generateMockJWT(user: User, expirationHours: number = 3): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId: user.id,
    email: user.email,
    userType: user.userType,
    iat: now,
    exp: now + expirationHours * 60 * 60, // Convert hours to seconds
  };

  // In production, this would be properly signed JWT
  // For demo purposes, we'll use base64 encoded payload with signature simulation
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signature = btoa(`signature_${user.id}_${now}`);

  return `${header}.${payloadEncoded}.${signature}`;
}

// Validate credentials against default hardcoded values
function validateCredentials(email: string, password: string): boolean {
  return email === DEFAULT_CREDENTIALS.email && password === DEFAULT_CREDENTIALS.password;
}

// Helper functions for dynamic questions
function getCurrentTimeAnswer(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  if (hour >= 17 && hour < 21) return 'Evening';
  return 'Night';
}

function getCurrentDayAnswer(): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
}

function getCurrentMonthAnswer(): string {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[new Date().getMonth()];
}

function isWeekday(): boolean {
  const day = new Date().getDay();
  return day >= 1 && day <= 5;
}

function getCurrentSeasonAnswer(): string {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'Spring';
  if (month >= 5 && month <= 7) return 'Summer';
  if (month >= 8 && month <= 10) return 'Autumn';
  return 'Winter';
}

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Mock data structure
const mockData = {
  users: [] as User[],
  settings: {
    language: 'en',
    theme: 'light',
    notifications: {
      enabled: true,
      sound: true,
      vibration: false,
    },
    accessibility: {
      fontSize: 'medium',
      highContrast: false,
      screenReader: false,
    },
    privacy: {
      dataCollection: false,
      analytics: false,
      crashReporting: false,
    },
    updates: {
      autoUpdate: true,
      betaChannel: false,
    },
  } as AppSettings,
  // Watching tokens management
  watchingTokens: new Map<
    string,
    {
      personId: string;
      platformUrl: string;
      createdAt: number;
      expiresAt: number;
      sessionStartTime: number;
      dailyWatchedTime: number; // in minutes
      questionsAsked: number;
    }
  >(),
  // Watching history
  watchingHistory: [] as {
    id: string;
    personId: string;
    date: string;
    platform: string;
    watchedMinutes: number;
    questionsAnswered: number;
    questionsCorrect: number;
  }[],
  questionBank: {
    math: {
      easy: [
        {
          type: 'calculation' as const,
          content: 'What is 7 + 5?',
          correctAnswer: 12,
          explanation: '7 + 5 = 12',
        },
        {
          type: 'calculation' as const,
          content: 'What is 9 - 3?',
          correctAnswer: 6,
          explanation: '9 - 3 = 6',
        },
        {
          type: 'calculation' as const,
          content: 'What is 4 × 6?',
          correctAnswer: 24,
          explanation: '4 × 6 = 24',
        },
        {
          type: 'multiple-choice' as const,
          content: 'Which number comes after 15?',
          options: ['14', '16', '17', '18'],
          correctAnswer: '16',
          explanation: 'The number after 15 is 16',
        },
        {
          type: 'calculation' as const,
          content: 'What is 10 + 2?',
          correctAnswer: 12,
          explanation: '10 + 2 = 12',
        },
      ],
      medium: [
        {
          type: 'calculation' as const,
          content: 'What is 18 ÷ 3?',
          correctAnswer: 6,
          explanation: '18 ÷ 3 = 6',
        },
        {
          type: 'calculation' as const,
          content: 'What is 25 - 8?',
          correctAnswer: 17,
          explanation: '25 - 8 = 17',
        },
        {
          type: 'calculation' as const,
          content: 'What is 5 × 7?',
          correctAnswer: 35,
          explanation: '5 × 7 = 35',
        },
        {
          type: 'calculation' as const,
          content: 'What is 12 + 15?',
          correctAnswer: 27,
          explanation: '12 + 15 = 27',
        },
        {
          type: 'calculation' as const,
          content: 'What is 32 ÷ 4?',
          correctAnswer: 8,
          explanation: '32 ÷ 4 = 8',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What is half of 26?',
          options: ['12', '13', '14', '15'],
          correctAnswer: '13',
          explanation: 'Half of 26 is 13',
        },
      ],
      hard: [
        {
          type: 'calculation' as const,
          content: 'What is 4 × 5 + 3?',
          correctAnswer: 23,
          explanation: '4 × 5 = 20, then 20 + 3 = 23',
        },
        {
          type: 'calculation' as const,
          content: 'What is 36 ÷ 4 + 2?',
          correctAnswer: 11,
          explanation: '36 ÷ 4 = 9, then 9 + 2 = 11',
        },
        {
          type: 'calculation' as const,
          content: 'What is 15 × 3 - 7?',
          correctAnswer: 38,
          explanation: '15 × 3 = 45, then 45 - 7 = 38',
        },
        {
          type: 'calculation' as const,
          content: 'What is 48 ÷ 6 + 5?',
          correctAnswer: 13,
          explanation: '48 ÷ 6 = 8, then 8 + 5 = 13',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What is 3² + 4?',
          options: ['7', '9', '13', '15'],
          correctAnswer: '13',
          explanation: '3² = 9, then 9 + 4 = 13',
        },
      ],
    },
    chinese: {
      easy: [
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：壹',
          options: ['1', '2', '3', '4'],
          correctAnswer: '1',
          explanation: '壹 = 1 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：贰',
          options: ['1', '2', '3', '4'],
          correctAnswer: '2',
          explanation: '贰 = 2 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：叁',
          options: ['1', '2', '3', '4'],
          correctAnswer: '3',
          explanation: '叁 = 3 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：肆',
          options: ['3', '4', '5', '6'],
          correctAnswer: '4',
          explanation: '肆 = 4 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：伍',
          options: ['3', '4', '5', '6'],
          correctAnswer: '5',
          explanation: '伍 = 5 (大写数字)',
        },
      ],
      medium: [
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：陆',
          options: ['4', '5', '6', '7'],
          correctAnswer: '6',
          explanation: '陆 = 6 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：柒',
          options: ['5', '6', '7', '8'],
          correctAnswer: '7',
          explanation: '柒 = 7 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：捌',
          options: ['6', '7', '8', '9'],
          correctAnswer: '8',
          explanation: '捌 = 8 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：玖',
          options: ['7', '8', '9', '10'],
          correctAnswer: '9',
          explanation: '玖 = 9 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：拾',
          options: ['8', '9', '10', '11'],
          correctAnswer: '10',
          explanation: '拾 = 10 (大写数字)',
        },
      ],
      hard: [
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：佰',
          options: ['50', '100', '150', '200'],
          correctAnswer: '100',
          explanation: '佰 = 100 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：仟',
          options: ['500', '1000', '1500', '2000'],
          correctAnswer: '1000',
          explanation: '仟 = 1000 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：万',
          options: ['5000', '10000', '15000', '20000'],
          correctAnswer: '10000',
          explanation: '万 = 10000 (大写数字)',
        },
        {
          type: 'multiple-choice' as const,
          content: '识别大写数字：亿',
          options: ['100000', '1000000', '100000000', '1000000000'],
          correctAnswer: '100000000',
          explanation: '亿 = 100000000 (大写数字)',
        },
      ],
    },
    english: {
      easy: [
        {
          type: 'multiple-choice' as const,
          content: 'What time is it now?',
          options: ['Morning', 'Afternoon', 'Evening', 'Night'],
          correctAnswer: getCurrentTimeAnswer(),
          explanation: 'Based on current time',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What day is today?',
          options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          correctAnswer: getCurrentDayAnswer(),
          explanation: 'Based on current day',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What color is the sky?',
          options: ['Blue', 'Green', 'Red', 'Yellow'],
          correctAnswer: 'Blue',
          explanation: 'The sky is usually blue during the day',
        },
        {
          type: 'multiple-choice' as const,
          content: 'How many fingers do you have?',
          options: ['8', '9', '10', '11'],
          correctAnswer: '10',
          explanation: 'You have 10 fingers (5 on each hand)',
        },
      ],
      medium: [
        {
          type: 'multiple-choice' as const,
          content: 'What month is it now?',
          options: [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ],
          correctAnswer: getCurrentMonthAnswer(),
          explanation: 'Based on current month',
        },
        {
          type: 'true-false' as const,
          content: 'Is it a weekday today?',
          correctAnswer: isWeekday(),
          explanation: 'Weekdays are Monday to Friday',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What is the opposite of "big"?',
          options: ['Large', 'Small', 'Huge', 'Giant'],
          correctAnswer: 'Small',
          explanation: 'The opposite of "big" is "small"',
        },
        {
          type: 'multiple-choice' as const,
          content: 'How many days are in a week?',
          options: ['5', '6', '7', '8'],
          correctAnswer: '7',
          explanation: 'There are 7 days in a week',
        },
      ],
      hard: [
        {
          type: 'fill-blank' as const,
          content: 'Complete: "Today is ___"',
          correctAnswer: getCurrentDayAnswer(),
          explanation: 'Fill in the current day',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What season is it now?',
          options: ['Spring', 'Summer', 'Autumn', 'Winter'],
          correctAnswer: getCurrentSeasonAnswer(),
          explanation: 'Based on current season',
        },
        {
          type: 'multiple-choice' as const,
          content: 'What is the capital of England?',
          options: ['Manchester', 'Liverpool', 'London', 'Birmingham'],
          correctAnswer: 'London',
          explanation: 'London is the capital of England',
        },
        {
          type: 'true-false' as const,
          content: 'The sun rises in the east',
          correctAnswer: true,
          explanation: 'Yes, the sun rises in the east and sets in the west',
        },
      ],
    },
  },
};

// Generate questions based on subjects, difficulty, and count
function generateQuestions(subjects: string[], difficulty: string, count: number): Question[] {
  const questions: Question[] = [];
  const availableQuestions: any[] = [];

  // Collect all available questions from specified subjects and difficulty
  subjects.forEach(subject => {
    if (
      mockData.questionBank[subject as keyof typeof mockData.questionBank] &&
      mockData.questionBank[subject as keyof typeof mockData.questionBank][difficulty as keyof typeof mockData.questionBank.math]
    ) {
      availableQuestions.push(
        ...mockData.questionBank[subject as keyof typeof mockData.questionBank][difficulty as keyof typeof mockData.questionBank.math]
      );
    }
  });

  // Shuffle and select questions
  const shuffled = shuffleArray([...availableQuestions]);
  const selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));

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
      language: 'en', // Default to English, can be made configurable
    };
    questions.push(question);
  });

  return questions;
}

// In-memory API handler for demo purposes
export class MockAPIHandler implements IAPIHandler {
  private currentUser: User | null = null;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData() {
    // Initialize with some demo data
    const demoParent: Parental = {
      id: 'parent_demo_001',
      email: 'demo@parent.com',
      phone: '+1234567890',
      name: 'Demo Parent',
      userType: 'PARENTAL',
      controlPassword: '123456',
      persons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const demoPerson: Person = {
      id: 'person_demo_001',
      parentalId: 'parent_demo_001',
      userType: 'PERSON',
      email: 'demo.child@kidsviewer.local',
      name: 'Demo Child',
      alias: 'Demo Child',
      ageGroup: 'young',
      settings: {
        timeLimit: 20,
        questionCount: 3,
        subjects: [
          { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
          { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
          { id: 'english', name: 'English', enabled: true, difficulty: 'easy' },
        ],
        allowedUrls: ['https://www.khanacademy.org/kids', 'https://kids.nationalgeographic.com/', 'https://www.youtubekids.com/'],
      },
      statistics: {
        dailyUsage: [],
        questionStats: {
          totalAnswered: 15,
          totalCorrect: 12,
          accuracyRate: 80,
          subjectPreference: {},
          repeatedQuestions: [],
        },
        learningProgress: {
          subjects: {},
          overallScore: 75,
          level: 'beginner',
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    demoParent.persons.push(demoPerson);
    mockData.users.push(demoParent, demoPerson);
  }

  // Authentication
  async register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const existingUser = mockData.users.find((u: any) => u.email === email);

      if (existingUser) {
        return { success: false, error: 'User already exists' };
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
        updatedAt: new Date(),
      };

      mockData.users.push(newUser);
      this.currentUser = newUser;

      // Create a default mock person for demo purposes
      const defaultPerson: Person = {
        id: this.generateId(),
        parentalId: newUser.id,
        userType: 'PERSON',
        email: `demo@kidsviewer.local`,
        name: 'Demo Child',
        alias: 'Demo Child',
        ageGroup: 'young',
        settings: {
          timeLimit: 20,
          questionCount: 3,
          subjects: [
            { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
            { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' },
          ],
          allowedUrls: ['https://www.khanacademy.org/kids', 'https://kids.nationalgeographic.com/', 'https://www.youtubekids.com/'],
        },
        statistics: {
          dailyUsage: [],
          questionStats: {
            totalAnswered: 15,
            totalCorrect: 12,
            accuracyRate: 80,
            subjectPreference: {},
            repeatedQuestions: [],
          },
          learningProgress: {
            subjects: {},
            overallScore: 75,
            level: 'beginner',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockData.users.push(defaultPerson);
      newUser.persons.push(defaultPerson);

      // Generate JWT token with 3 hours expiration
      const token = generateMockJWT(newUser, 3);

      return { success: true, data: { user: newUser, token } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      // Use hardcoded credentials for demo
      if (!validateCredentials(email, password)) {
        return { success: false, error: 'Invalid credentials. Use demo@parent.com / 123456' };
      }

      // Find the demo user or use hardcoded demo user
      let user = mockData.users.find((u: any) => u.email === email && u.userType === 'PARENTAL');
      
      if (!user) {
        // Create demo user if not exists
        const demoUser: Parental = {
          id: 'demo_parent_001',
          email: DEFAULT_CREDENTIALS.email,
          phone: '+1234567890',
          name: 'Demo Parent',
          userType: 'PARENTAL',
          controlPassword: DEFAULT_CREDENTIALS.password,
          persons: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Add demo child
        const demoChild: Person = {
          id: 'demo_child_001',
          parentalId: demoUser.id,
          userType: 'PERSON',
          email: 'demo.child@kidsviewer.local',
          name: 'Demo Child',
          alias: 'Demo Child',
          ageGroup: 'young',
          settings: {
            timeLimit: 20,
            questionCount: 3,
            subjects: [
              { id: 'math', name: 'Math', enabled: true, difficulty: 'easy' },
              { id: 'chinese', name: 'Chinese', enabled: true, difficulty: 'easy' },
              { id: 'english', name: 'English', enabled: true, difficulty: 'easy' },
            ],
            allowedUrls: ['https://www.khanacademy.org/kids', 'https://kids.nationalgeographic.com/', 'https://www.youtubekids.com/'],
          },
          statistics: {
            dailyUsage: [],
            questionStats: {
              totalAnswered: 15,
              totalCorrect: 12,
              accuracyRate: 80,
              subjectPreference: {},
              repeatedQuestions: [],
            },
            learningProgress: {
              subjects: {},
              overallScore: 75,
              level: 'beginner',
            },
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        demoUser.persons.push(demoChild);
        mockData.users.push(demoUser, demoChild);
        user = demoUser;
      }

      if (user.userType !== 'PARENTAL') {
        return { success: false, error: 'Only parental accounts can login' };
      }

      this.currentUser = user;
      
      // Generate JWT token with 3 hours expiration
      const token = generateMockJWT(user, 3);

      return { success: true, data: { user, token } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    this.currentUser = null;
    return { success: true };
  }

  // User management
  async getCurrentUser(): Promise<ApiResponse<User>> {
    if (!this.currentUser) {
      return { success: false, error: 'No user logged in' };
    }
    return { success: true, data: this.currentUser };
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const userIndex = mockData.users.findIndex((u: any) => u.id === userId);

      if (userIndex === -1) {
        return { success: false, error: 'User not found' };
      }

      mockData.users[userIndex] = {
        ...mockData.users[userIndex],
        ...updates,
        updatedAt: new Date(),
      };

      if (this.currentUser?.id === userId) {
        this.currentUser = mockData.users[userIndex];
      }

      return { success: true, data: mockData.users[userIndex] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Parental operations
  async createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>> {
    try {
      const parental = mockData.users.find((u: any) => u.id === parentalId && u.userType === 'PARENTAL') as Parental;

      if (!parental) {
        return { success: false, error: 'Parental not found' };
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
            { id: 'english', name: 'English', enabled: true, difficulty: 'easy' },
          ],
          allowedUrls: personData.settings?.allowedUrls || [],
        },
        statistics: {
          dailyUsage: [],
          questionStats: {
            totalAnswered: 0,
            totalCorrect: 0,
            accuracyRate: 0,
            subjectPreference: {},
            repeatedQuestions: [],
          },
          learningProgress: {
            subjects: {},
            overallScore: 0,
            level: 'beginner',
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockData.users.push(newPerson);
      parental.persons.push(newPerson);

      return { success: true, data: newPerson };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getPersons(parentalId: string): Promise<ApiResponse<Person[]>> {
    try {
      const persons = mockData.users.filter((u: any) => u.parentalId === parentalId && u.userType === 'PERSON') as Person[];
      return { success: true, data: persons || [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>> {
    try {
      const personIndex = mockData.users.findIndex((u: any) => u.id === personId && u.userType === 'PERSON');

      if (personIndex === -1) {
        return { success: false, error: 'Person not found' };
      }

      const person = mockData.users[personIndex] as Person;
      person.settings = { ...person.settings, ...settings };
      person.updatedAt = new Date();

      return { success: true, data: person };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Person operations
  async getPerson(personId: string): Promise<ApiResponse<Person>> {
    try {
      const person = mockData.users.find((u: any) => u.id === personId && u.userType === 'PERSON') as Person;

      if (!person) {
        return { success: false, error: 'Person not found' };
      }

      return { success: true, data: person };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>> {
    try {
      const personIndex = mockData.users.findIndex((u: any) => u.id === personId && u.userType === 'PERSON');

      if (personIndex === -1) {
        return { success: false, error: 'Person not found' };
      }

      const person = mockData.users[personIndex] as Person;
      person.statistics = { ...person.statistics, ...statistics };
      person.updatedAt = new Date();

      return { success: true, data: person };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Questions
  async getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>> {
    try {
      const questions = generateQuestions(subjects, difficulty, count);
      return { success: true, data: questions };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async submitAnswer(_questionId: string, _answer: string | number, _isCorrect: boolean): Promise<ApiResponse<void>> {
    // This would typically update statistics, but for now just return success
    return { success: true };
  }

  // Statistics
  async getDailyReport(personId: string, _date: string): Promise<ApiResponse<Person['statistics']>> {
    try {
      const person = await this.getPerson(personId);
      if (!person.success || !person.data) {
        return { success: false, error: 'Person not found' };
      }
      return { success: true, data: person.data.statistics };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>> {
    try {
      const person = await this.getPerson(personId);
      if (!person.success || !person.data) {
        return { success: false, error: 'Person not found' };
      }
      return { success: true, data: person.data.statistics.learningProgress };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Settings
  async getAppSettings(): Promise<ApiResponse<AppSettings>> {
    try {
      return { success: true, data: mockData.settings };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
    try {
      mockData.settings = { ...mockData.settings, ...settings };
      return { success: true, data: mockData.settings };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Parental control password verification
  async verifyParentalPassword(password: string): Promise<ApiResponse<boolean>> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock implementation - in real app this would check against encrypted password
        const isValid = password === '123456'; // Default parental password
        resolve({
          success: isValid,
          data: isValid,
          message: isValid ? 'Password verified' : 'Invalid parental password',
        });
      }, 500);
    });
  }

  // Child accessible URLs - get platform name, difficulty, max daily time etc.
  async getPersonAccessibleUrls(_personId: string): Promise<
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
    return new Promise(resolve => {
      setTimeout(() => {
        // Mock data for child accessible URLs - mix of educational and entertainment platforms
        const mockUrls = [
          {
            platformName: '抖音短视频 (儿童版)',
            url: 'https://www.douyin.com/channel/300207',
            difficulty: 'easy',
            maxDailyTime: 15,
            description: '精选适合儿童的教育类短视频内容，寓教于乐',
          },
          {
            platformName: '小红书 Kids',
            url: 'https://www.xiaohongshu.com/explore',
            difficulty: 'medium',
            maxDailyTime: 20,
            description: '儿童手工制作、科学实验和创意绘画视频',
          },
          {
            platformName: 'Khan Academy Kids',
            url: 'https://www.khanacademy.org/kids',
            difficulty: 'easy',
            maxDailyTime: 30,
            description: 'Educational games and videos for young learners',
          },
          {
            platformName: 'National Geographic Kids',
            url: 'https://kids.nationalgeographic.com/',
            difficulty: 'medium',
            maxDailyTime: 45,
            description: 'Explore nature, science, and world cultures',
          },
          {
            platformName: 'Scratch Jr',
            url: 'https://scratchjr.org/',
            difficulty: 'hard',
            maxDailyTime: 60,
            description: 'Learn programming through creative coding',
          },
          {
            platformName: '腾讯视频 - 儿童频道',
            url: 'https://v.qq.com/channel/kids',
            difficulty: 'easy',
            maxDailyTime: 25,
            description: '精选儿童动画片、教育节目和科普内容',
          },
          {
            platformName: 'YouTube Kids',
            url: 'https://www.youtubekids.com/',
            difficulty: 'medium',
            maxDailyTime: 35,
            description: 'Safe, educational videos curated for children',
          },
          {
            platformName: 'BBC iPlayer Kids',
            url: 'https://www.bbc.co.uk/iplayer/categories/childrens',
            difficulty: 'medium',
            maxDailyTime: 40,
            description: 'Quality educational content from BBC',
          },
        ];

        // Simulate personalized content based on person settings
        // In a real app, this would filter based on the child's age group, preferences, etc.
        const personalizedUrls = mockUrls.slice(0, Math.floor(Math.random() * 5) + 3); // Return 3-7 platforms

        resolve({
          success: true,
          data: personalizedUrls,
          message: 'URLs retrieved successfully',
        });
      }, 300);
    });
  }

  // Watching control APIs
  async startWatching(personId: string, platformUrl: string): Promise<ApiResponse<{ watchingToken: string }>> {
    try {
      const token = this.generateId();
      const person = await this.getPerson(personId);
      if (!person.success || !person.data) {
        return { success: false, error: 'Person not found' };
      }

      const timeLimit = person.data.settings.timeLimit * 60 * 1000; // Convert to milliseconds
      const expiresAt = Date.now() + timeLimit;

      mockData.watchingTokens.set(token, {
        personId,
        platformUrl,
        createdAt: Date.now(),
        expiresAt,
        sessionStartTime: Date.now(),
        dailyWatchedTime: 0,
        questionsAsked: 0,
      });

      return { success: true, data: { watchingToken: token } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async checkWatching(watchingToken: string): Promise<
    ApiResponse<{
      code: number;
      data?: Question[];
      remainingTime?: number;
      dailyTimeExceeded?: boolean;
    }>
  > {
    try {
      const tokenData = mockData.watchingTokens.get(watchingToken);
      if (!tokenData) {
        return { success: false, error: 'Invalid or expired token' };
      }

      const currentTime = Date.now();
      const sessionTime = Math.floor((currentTime - tokenData.sessionStartTime) / (1000 * 60)); // in minutes
      const remainingTime = Math.max(0, Math.floor((tokenData.expiresAt - currentTime) / (1000 * 60)));

      // Check if session time exceeded
      if (currentTime > tokenData.expiresAt) {
        // Need to answer questions to continue
        const person = await this.getPerson(tokenData.personId);
        if (person.success && person.data) {
          const enabledSubjects = person.data.settings.subjects.filter((subject: any) => subject.enabled).map((subject: any) => subject.id);

          const questions = generateQuestions(enabledSubjects, 'easy', person.data.settings.questionCount);

          return {
            success: true,
            data: {
              code: 4017,
              data: questions,
              remainingTime: 0,
            },
          };
        }
      }

      // Check daily time limit (assume 2 hours max per day)
      const maxDailyMinutes = 120;
      if (sessionTime >= maxDailyMinutes) {
        return {
          success: true,
          data: {
            code: 4077,
            dailyTimeExceeded: true,
            remainingTime: 0,
          },
        };
      }

      // Normal watching state
      return {
        success: true,
        data: {
          code: 200,
          remainingTime,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
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
    try {
      const tokenData = mockData.watchingTokens.get(watchingToken);
      if (!tokenData) {
        return { success: false, error: 'Invalid or expired token' };
      }

      // Find question in all subjects
      let question: any = null;
      let correct = false;

      for (const subject of Object.keys(mockData.questionBank)) {
        for (const difficulty of Object.keys(mockData.questionBank[subject as keyof typeof mockData.questionBank])) {
          const questions =
            mockData.questionBank[subject as keyof typeof mockData.questionBank][difficulty as keyof typeof mockData.questionBank.math];
          const foundQuestion = questions.find((q: any) => q.content === questionId); // Use content as ID for now
          if (foundQuestion) {
            question = foundQuestion;
            correct = answer.toString() === foundQuestion.correctAnswer.toString();
            break;
          }
        }
        if (question) break;
      }

      if (!question) {
        return { success: false, error: 'Question not found' };
      }

      tokenData.questionsAsked++;

      if (correct) {
        // Generate new token with extended time
        const person = await this.getPerson(tokenData.personId);
        if (person.success && person.data) {
          const newToken = this.generateId();
          const timeLimit = person.data.settings.timeLimit * 60 * 1000;
          const newExpiresAt = Date.now() + timeLimit;

          mockData.watchingTokens.set(newToken, {
            ...tokenData,
            expiresAt: newExpiresAt,
            sessionStartTime: Date.now(),
          });

          // Remove old token
          mockData.watchingTokens.delete(watchingToken);

          return {
            success: true,
            data: {
              code: 200,
              correct: true,
              newWatchingToken: newToken,
            },
          };
        }
      }

      return {
        success: true,
        data: {
          code: 400,
          correct: false,
        },
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async getWatchingHistory(
    _personId: string,
    days: number = 7
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
    try {
      // Generate mock watching history
      const history = [];
      const platforms = ['抖音短视频', 'Khan Academy Kids', 'YouTube Kids', 'National Geographic Kids'];

      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        if (Math.random() > 0.3) {
          // 70% chance of watching on any given day
          history.push({
            date: date.toISOString().split('T')[0],
            platform: platforms[Math.floor(Math.random() * platforms.length)],
            watchedMinutes: Math.floor(Math.random() * 60) + 10,
            questionsAnswered: Math.floor(Math.random() * 5) + 1,
            questionsCorrect: Math.floor(Math.random() * 4) + 1,
          });
        }
      }

      return { success: true, data: history };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  // Helper methods
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
