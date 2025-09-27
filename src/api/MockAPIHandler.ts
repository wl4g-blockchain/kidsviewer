import { IAPIHandler } from './IAPIHandler';
import {
    User,
    Parental,
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

// Default hardcoded credentials for demo
const DEMO_CREDENTIALS = {
    email: 'lyra@kidsviewer.local',
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
    return email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password;
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
const mockDataDB = {
    users: [] as (User | Person)[],
    platforms: [] as Platform[],
    questionTemplates: [] as QuestionTemplate[],
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
            personId: number;
            platformId: number;
            createdAt: number;
            expiresAt: number;
            startTime: number;
            todayWatchedTime: number; // in minutes
            questionsAsked: number;
            currentQuestions?: Question[]; // Store current questions for verification
        }
    >(),
    // Watching history
    watchingHistories: [] as {
        id: number;
        personId: number;
        date: string;
        platform: string;
        watchedTime: number;
        questionsAnswered: number;
        questionsCorrect: number;
    }[],
};

// Generate questions based on subjects, difficulty, and count
function generateQuestions(subjects: string[], difficulty: string, count: number, language: string = 'en'): Question[] {
    const questions: Question[] = [];

    // Get available question templates that match criteria
    const availableTemplates = mockDataDB.questionTemplates.filter(
        template => subjects.includes(template.subject) && template.difficulty === difficulty
    );

    // Shuffle and select questions
    const shuffled = shuffleArray([...availableTemplates]);
    const selectedTemplates = shuffled.slice(0, Math.min(count, shuffled.length));

    // Convert templates to Question instances with appropriate explanation
    selectedTemplates.forEach((template) => {
        const question: Question = {
            id: Math.floor(Math.random() * 1000000),
            type: template.type,
            subject: template.subject,
            difficulty: template.difficulty,
            content: template.content,
            options: template.options || (template.type === 'calculation' ? generateCalculationOptions(Number(template.correctAnswer)) : []),
            correctAnswer: template.correctAnswer,
            explanation: language === 'zh' ? template.explanationCN : template.explanationEN,
            language: template.language,
        };
        questions.push(question);
    });

    return questions;
}

// Generate options for calculation questions
function generateCalculationOptions(correctAnswer: number): string[] {
    const options = [correctAnswer.toString()];
    const wrongAnswers = new Set<string>();

    // Generate 3 wrong answers
    while (wrongAnswers.size < 3) {
        const variation = Math.floor(Math.random() * 4) + 1; // 1-4
        const wrongAnswer = correctAnswer + (Math.random() > 0.5 ? variation : -variation);
        if (wrongAnswer > 0 && !options.includes(wrongAnswer.toString())) {
            wrongAnswers.add(wrongAnswer.toString());
        }
    }

    options.push(...Array.from(wrongAnswers));
    return options.sort(() => Math.random() - 0.5); // Shuffle
}

// Helper function to create standard API response
function createApiResponse<T>(errcode: string = '200', errmsg: string = 'ok', data?: T): ApiResponse<T> {
    return {
        errcode,
        errmsg,
        data,
    };
}

// In-memory API handler for demo purposes
export class MockAPIHandler implements IAPIHandler {
    private currentUser: User | null = null;

    constructor() {
        this.initializeMockData();
    }

    private initializeMockData() {
        // Initialize platforms
        this.initializePlatforms();

        // Initialize question templates
        this.initializeQuestionTemplates();

        // Initialize with some demo data
        const parent_01: Parental = {
            id: 1,
            email: 'lyra@kidsviewer.local',
            phone: '+1234567890',
            name: 'Lyra',
            userType: 'PARENTAL',
            controlPassword: '123456',
            persons: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const person_01: Person = {
            id: 1,
            userId: 1,
            parentalId: 1,
            name: 'Barry',
            alias: 'Barry',
            ageGroup: 'young',
            settings: {
                perTimeLimitMinutes: 1,
                dailyTimeLimitMinutes: 120,
                questionCount: 5,
                questionsPerDay: 15,
                platformIds: [1, 2, 3, 4],
                subjects: [
                    { id: Math.floor(Math.random() * 1000000), name: 'Math', enabled: true, difficulty: 'easy' },
                    { id: Math.floor(Math.random() * 1000000), name: 'Chinese', enabled: true, difficulty: 'easy' },
                    { id: Math.floor(Math.random() * 1000000), name: 'English', enabled: true, difficulty: 'easy' },
                ],
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

        parent_01.persons.push(person_01);
        mockDataDB.users.push(parent_01, person_01);
    }

    private initializePlatforms() {
        const platforms: Platform[] = [
            {
                id: 1,
                nameEN: 'National Geographic Kids',
                nameCN: '国家地理儿童版',
                url: 'https://kids.nationalgeographic.com/',
                description: 'Explore nature, science, and world cultures',
                ageGroups: ['young', 'older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 2,
                nameEN: 'Khan Academy Kids',
                nameCN: '可汗学院儿童版',
                url: 'https://www.khanacademy.org/kids',
                description: 'Educational games and videos for young learners',
                ageGroups: ['preschool', 'young'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 3,
                nameEN: 'YouTube Kids',
                nameCN: 'YouTube 儿童版',
                url: 'https://www.youtubekids.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['young', 'older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: 4,
                nameEN: 'Douyin',
                nameCN: '抖音',
                url: 'https://www.douyin.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['young', 'older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                nameEN: 'Xiaohongshu',
                nameCN: '小红书',
                url: 'https://www.xiaohongshu.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                nameEN: 'Kuaishou',
                nameCN: '快手',
                url: 'https://www.kuaishou.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['young', 'older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                nameEN: 'Bilibili',
                nameCN: '哔哩哔哩',
                url: 'https://www.bilibili.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                nameEN: 'Qiyiguo',
                nameCN: '奇异果',
                url: 'https://www.qiyiguo.com/',
                description: 'Safe, educational videos curated for children',
                ageGroups: ['preschool', 'young', 'older'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        mockDataDB.platforms.push(...platforms);
    }

    private initializeQuestionTemplates() {
        // Create simplified question templates with i18n support
        const templates: QuestionTemplate[] = [
            // Math questions - Beginner level
            {
                id: 1,
                type: 'calculation',
                subject: 'math',
                difficulty: 'beginner',
                content: 'What is 2 + 3?',
                correctAnswer: 5,
                explanationEN: '2 + 3 = 5. This is basic addition.',
                explanationCN: '2 + 3 = 5。这是基本的加法。',
                language: 'en',
                ageGroups: ['preschool', 'young'],
                tags: ['math', 'addition', 'beginner'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Math questions - Easy level
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'easy',
                content: 'What is 7 + 5?',
                correctAnswer: 12,
                explanationEN: '7 + 5 = 12. Count up from 7: 8, 9, 10, 11, 12.',
                explanationCN: '7 + 5 = 12。从7开始数：8、9、10、11、12。',
                language: 'en',
                ageGroups: ['young'],
                tags: ['math', 'addition', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Math questions - Medium level
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'medium',
                content: 'What is 18 ÷ 3?',
                correctAnswer: 6,
                explanationEN: '18 ÷ 3 = 6. Division means how many groups of 3 can we make from 18.',
                explanationCN: '18 ÷ 3 = 6。除法意思是18可以分成多少个3。',
                language: 'en',
                ageGroups: ['young', 'older'],
                tags: ['math', 'division', 'medium'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Math questions - Hard level
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'hard',
                content: 'What is 4 × 5 + 3?',
                correctAnswer: 23,
                explanationEN: '4 × 5 + 3 = 23. First multiply: 4 × 5 = 20, then add: 20 + 3 = 23.',
                explanationCN: '4 × 5 + 3 = 23。先乘法：4 × 5 = 20，再加法：20 + 3 = 23。',
                language: 'en',
                ageGroups: ['older'],
                tags: ['math', 'multiplication', 'addition', 'hard'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Math questions - Expert level
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'math',
                difficulty: 'expert',
                content: 'What is 3² + 4²?',
                options: ['7', '12', '25', '49'],
                correctAnswer: '25',
                explanationEN: '3² + 4² = 9 + 16 = 25. This uses the Pythagorean theorem.',
                explanationCN: '3² + 4² = 9 + 16 = 25。这使用了勾股定理。',
                language: 'en',
                ageGroups: ['older', 'teen'],
                tags: ['math', 'squares', 'expert'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Chinese questions
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'chinese',
                difficulty: 'easy',
                content: '识别大写数字：壹',
                options: ['1', '2', '3', '4'],
                correctAnswer: '1',
                explanationEN: '壹 = 1 (Chinese traditional number)',
                explanationCN: '壹 = 1 (中文大写数字)',
                language: 'zh',
                ageGroups: ['young', 'older'],
                tags: ['chinese', 'numbers', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // English questions
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'english',
                difficulty: 'easy',
                content: 'What color is the sky?',
                options: ['Blue', 'Green', 'Red', 'Yellow'],
                correctAnswer: 'Blue',
                explanationEN: 'The sky is usually blue during the day due to light scattering.',
                explanationCN: '天空通常是蓝色的，因为光线散射。',
                language: 'en',
                ageGroups: ['preschool', 'young'],
                tags: ['english', 'colors', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Additional math questions
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'easy',
                content: 'What is 9 - 3?',
                correctAnswer: 6,
                explanationEN: '9 - 3 = 6. Subtraction means taking away.',
                explanationCN: '9 - 3 = 6。减法意思是拿走。',
                language: 'en',
                ageGroups: ['young'],
                tags: ['math', 'subtraction', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'easy',
                content: 'What is 4 × 6?',
                correctAnswer: 24,
                explanationEN: '4 × 6 = 24. Multiplication means repeated addition.',
                explanationCN: '4 × 6 = 24。乘法意思是重复加法。',
                language: 'en',
                ageGroups: ['young'],
                tags: ['math', 'multiplication', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'math',
                difficulty: 'easy',
                content: 'Which number comes after 15?',
                options: ['14', '16', '17', '18'],
                correctAnswer: '16',
                explanationEN: 'The number after 15 is 16.',
                explanationCN: '15后面的数字是16。',
                language: 'en',
                ageGroups: ['young'],
                tags: ['math', 'counting', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'calculation',
                subject: 'math',
                difficulty: 'easy',
                content: 'What is 10 + 2?',
                correctAnswer: 12,
                explanationEN: '10 + 2 = 12. Adding 2 to 10 gives 12.',
                explanationCN: '10 + 2 = 12。10加2等于12。',
                language: 'en',
                ageGroups: ['young'],
                tags: ['math', 'addition', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // Chinese questions
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'chinese',
                difficulty: 'easy',
                content: '识别大写数字：壹',
                options: ['1', '2', '3', '4'],
                correctAnswer: '1',
                explanationEN: '壹 = 1 (Chinese traditional number)',
                explanationCN: '壹 = 1 (中文大写数字)',
                language: 'zh',
                ageGroups: ['young', 'older'],
                tags: ['chinese', 'numbers', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'chinese',
                difficulty: 'easy',
                content: '识别大写数字：贰',
                options: ['1', '2', '3', '4'],
                correctAnswer: '2',
                explanationEN: '贰 = 2 (Chinese traditional number)',
                explanationCN: '贰 = 2 (中文大写数字)',
                language: 'zh',
                ageGroups: ['young', 'older'],
                tags: ['chinese', 'numbers', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'chinese',
                difficulty: 'easy',
                content: '识别大写数字：叁',
                options: ['1', '2', '3', '4'],
                correctAnswer: '3',
                explanationEN: '叁 = 3 (Chinese traditional number)',
                explanationCN: '叁 = 3 (中文大写数字)',
                language: 'zh',
                ageGroups: ['young', 'older'],
                tags: ['chinese', 'numbers', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            // English questions
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'english',
                difficulty: 'easy',
                content: 'What time is it now?',
                options: ['Morning', 'Afternoon', 'Evening', 'Night'],
                correctAnswer: getCurrentTimeAnswer(),
                explanationEN: 'Based on current time',
                explanationCN: '根据当前时间',
                language: 'en',
                ageGroups: ['young'],
                tags: ['english', 'time', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'english',
                difficulty: 'easy',
                content: 'What day is today?',
                options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                correctAnswer: getCurrentDayAnswer(),
                explanationEN: 'Based on current day',
                explanationCN: '根据当前日期',
                language: 'en',
                ageGroups: ['young'],
                tags: ['english', 'days', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: Math.floor(Math.random() * 1000000),
                type: 'multiple-choice',
                subject: 'english',
                difficulty: 'easy',
                content: 'How many fingers do you have?',
                options: ['8', '9', '10', '11'],
                correctAnswer: '10',
                explanationEN: 'You have 10 fingers (5 on each hand)',
                explanationCN: '你有10个手指（每只手5个）',
                language: 'en',
                ageGroups: ['preschool', 'young'],
                tags: ['english', 'counting', 'easy'],
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        mockDataDB.questionTemplates.push(...templates);
    }

    // Authentication
    async register(email: string, phone: string, password: string, name: string): Promise<ApiResponse<{ user: User; token: string }>> {
        try {
            const existingUser = mockDataDB.users.find((u: any) => u.email === email);

            if (existingUser) {
                return createApiResponse('4001', 'User already exists');
            }

            const newUser: Parental = {
                id: Math.floor(Math.random() * 1000000),
                email,
                phone,
                name,
                userType: 'PARENTAL',
                controlPassword: password,
                persons: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDataDB.users.push(newUser);
            this.currentUser = newUser;

            // Create a default mock person for demo purposes
            const defaultPerson: Person = {
                id: Math.floor(Math.random() * 1000000),
                userId: newUser.id,
                parentalId: newUser.id,
                name: 'Barry',
                alias: 'Barry',
                ageGroup: 'young',
                settings: {
                    perTimeLimitMinutes: 20,
                    dailyTimeLimitMinutes: 120,
                    questionCount: 3,
                    questionsPerDay: 15,
                    subjects: [
                        { id: Math.floor(Math.random() * 1000000), name: 'Math', enabled: true, difficulty: 'easy' },
                        { id: Math.floor(Math.random() * 1000000), name: 'Chinese', enabled: true, difficulty: 'easy' },
                        { id: Math.floor(Math.random() * 1000000), name: 'English', enabled: true, difficulty: 'easy' },
                    ],
                    platformIds: [1, 2, 3],
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

            mockDataDB.users.push(defaultPerson);
            newUser.persons.push(defaultPerson);

            // Generate JWT token with 3 hours expiration
            const token = generateMockJWT(newUser, 3);

            return createApiResponse('200', 'ok', { user: newUser, token });
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
        try {
            // Use hardcoded credentials for demo
            if (!validateCredentials(email, password)) {
                return createApiResponse('4002', 'Invalid credentials. Use lyra@kidsviewer.local / 123456');
            }

            // Find the demo user or use hardcoded demo user
            let user = mockDataDB.users.find((u: any) => u.email === email && 'userType' in u && u.userType === 'PARENTAL') as User | undefined;
            if (!user) {
                // Create demo user if not exists
                const parental_0: Parental = {
                    id: 1,
                    email: DEMO_CREDENTIALS.email,
                    phone: '+1234567890',
                    name: 'Lyra Parent',
                    userType: 'PARENTAL',
                    controlPassword: DEMO_CREDENTIALS.password,
                    persons: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };

                // Add mock child person 0
                const person_0: Person = {
                    id: 2,
                    userId: parental_0.id,
                    parentalId: parental_0.id,
                    name: 'Barry',
                    alias: 'Barry',
                    ageGroup: 'young',
                    settings: {
                        perTimeLimitMinutes: 20,
                        dailyTimeLimitMinutes: 120,
                        questionCount: 3,
                        questionsPerDay: 15,
                        subjects: [
                            { id: Math.floor(Math.random() * 1000000), name: 'Math', enabled: true, difficulty: 'easy' },
                            { id: Math.floor(Math.random() * 1000000), name: 'Chinese', enabled: true, difficulty: 'easy' },
                            { id: Math.floor(Math.random() * 1000000), name: 'English', enabled: true, difficulty: 'easy' },
                        ],
                        platformIds: [1, 2, 3],
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

                parental_0.persons.push(person_0);
                mockDataDB.users.push(parental_0, person_0);
                user = parental_0;
            }

            if (!('userType' in user) || user.userType !== 'PARENTAL') {
                return createApiResponse('4003', 'Only parental accounts can login');
            }

            this.currentUser = user as User;

            // Generate JWT token with 3 hours expiration
            const token = generateMockJWT(user as User, 3);

            return createApiResponse('200', 'ok', { user: user as User, token });
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async logout(): Promise<ApiResponse<void>> {
        this.currentUser = null;
        return createApiResponse('200', 'ok');
    }

    // User management
    async getCurrentUser(): Promise<ApiResponse<User>> {
        if (!this.currentUser) {
            return createApiResponse('4004', 'No user logged in');
        }
        return createApiResponse('200', 'ok', this.currentUser);
    }

    async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
        try {
            const userIndex = mockDataDB.users.findIndex((u: any) => u.id === parseInt(userId));

            if (userIndex === -1) {
                return createApiResponse('4001', 'User not found');
            }

            const currentUser = mockDataDB.users[userIndex] as User;
            const updatedUser: User = {
                ...currentUser,
                ...updates,
                updatedAt: new Date(),
            };

            mockDataDB.users[userIndex] = updatedUser;

            if (this.currentUser?.id === parseInt(userId)) {
                this.currentUser = updatedUser;
            }

            return createApiResponse('200', 'ok', updatedUser);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Parental operations
    async createPerson(parentalId: string, personData: Partial<Person>): Promise<ApiResponse<Person>> {
        try {
            const parental = mockDataDB.users.find((u: any) => u.id === parseInt(parentalId) && 'userType' in u && u.userType === 'PARENTAL') as Parental;

            if (!parental) {
                return createApiResponse('4001', 'Parental not found');
            }

            // Default platform IDs for new persons
            const defaultPlatformIds = [1, 2, 3];

            const newPerson: Person = {
                id: Math.floor(Math.random() * 1000000),
                userId: parental.id,
                parentalId: parental.id,
                name: personData.alias || 'Person',
                alias: personData.alias || 'Person',
                ageGroup: personData.ageGroup || 'young',
                settings: {
                    perTimeLimitMinutes: personData.settings?.perTimeLimitMinutes || 15,
                    dailyTimeLimitMinutes: personData.settings?.dailyTimeLimitMinutes || 120,
                    questionCount: personData.settings?.questionCount || 3,
                    questionsPerDay: personData.settings?.questionsPerDay || 15,
                    subjects: personData.settings?.subjects || [
                        { id: Math.floor(Math.random() * 1000000), name: 'Math', enabled: true, difficulty: 'easy' },
                        { id: Math.floor(Math.random() * 1000000), name: 'Chinese', enabled: true, difficulty: 'easy' },
                        { id: Math.floor(Math.random() * 1000000), name: 'English', enabled: true, difficulty: 'easy' },
                    ],
                    platformIds: personData.settings?.platformIds || defaultPlatformIds,
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

            mockDataDB.users.push(newPerson);
            parental.persons.push(newPerson);

            return createApiResponse('200', 'ok', newPerson);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async getPersons(parentalId: string): Promise<ApiResponse<Person[]>> {
        try {
            const parentalIdNum = parseInt(parentalId);
            const persons = mockDataDB.users.filter((u: any) => 'parentalId' in u && u.parentalId === parentalIdNum) as Person[];
            return createApiResponse('200', 'ok', persons || []);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async updatePersonSettings(personId: string, settings: Partial<Person['settings']>): Promise<ApiResponse<Person>> {
        try {
            const personIdNum = parseInt(personId);
            const personIndex = mockDataDB.users.findIndex((u: any) => 'id' in u && u.id === personIdNum && 'parentalId' in u);

            if (personIndex === -1) {
                return createApiResponse('4001', 'Person not found');
            }

            const person = mockDataDB.users[personIndex] as Person;
            person.settings = { ...person.settings, ...settings };
            person.updatedAt = new Date();

            return createApiResponse('200', 'ok', person);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async deletePerson(personId: string): Promise<ApiResponse<void>> {
        try {
            const personIdNum = parseInt(personId);
            const personIndex = mockDataDB.users.findIndex((u: any) => 'id' in u && u.id === personIdNum && 'parentalId' in u);

            if (personIndex === -1) {
                return createApiResponse('4001', 'Person not found');
            }

            const person = mockDataDB.users[personIndex] as Person;
            const parentalIndex = mockDataDB.users.findIndex((u: any) => u.id === person.parentalId && 'userType' in u && u.userType === 'PARENTAL');

            if (parentalIndex !== -1) {
                const parental = mockDataDB.users[parentalIndex] as Parental;
                parental.persons = parental.persons.filter(p => p.id !== personIdNum);
            }

            // Remove person from users array
            mockDataDB.users.splice(personIndex, 1);

            return createApiResponse('200', 'ok');
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Person operations
    async getPerson(personId: string): Promise<ApiResponse<Person>> {
        try {
            const personIdNum = parseInt(personId);
            const person = mockDataDB.users.find((u: any) => 'id' in u && u.id === personIdNum && 'parentalId' in u) as Person;

            if (!person) {
                return createApiResponse('4001', 'Person not found');
            }

            return createApiResponse('200', 'ok', person);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async updatePersonStatistics(personId: string, statistics: Partial<Person['statistics']>): Promise<ApiResponse<Person>> {
        try {
            const personIdNum = parseInt(personId);
            const personIndex = mockDataDB.users.findIndex((u: any) => 'id' in u && u.id === personIdNum && 'parentalId' in u);

            if (personIndex === -1) {
                return createApiResponse('4001', 'Person not found');
            }

            const person = mockDataDB.users[personIndex] as Person;
            person.statistics = { ...person.statistics, ...statistics };
            person.updatedAt = new Date();

            return createApiResponse('200', 'ok', person);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Questions
    async getQuestions(subjects: string[], difficulty: string, count: number): Promise<ApiResponse<Question[]>> {
        try {
            const questions = generateQuestions(subjects, difficulty, count);
            return createApiResponse('200', 'ok', questions);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async submitAnswer(_questionId: string, _answer: string | number, _isCorrect: boolean): Promise<ApiResponse<void>> {
        // This would typically update statistics, but for now just return success
        return createApiResponse('200', 'ok');
    }

    // Statistics
    async getDailyReport(personId: string, _date: string): Promise<ApiResponse<Person['statistics']>> {
        try {
            const person = await this.getPerson(personId);
            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }
            return createApiResponse('200', 'ok', person.data.statistics);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async getLearningProgress(personId: string): Promise<ApiResponse<Person['statistics']['learningProgress']>> {
        try {
            const person = await this.getPerson(personId);
            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }
            return createApiResponse('200', 'ok', person.data.statistics.learningProgress);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Settings
    async getAppSettings(): Promise<ApiResponse<AppSettings>> {
        try {
            return createApiResponse('200', 'ok', mockDataDB.settings);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async updateAppSettings(settings: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
        try {
            mockDataDB.settings = { ...mockDataDB.settings, ...settings };
            return createApiResponse('200', 'ok', mockDataDB.settings);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async getAppInfo(): Promise<ApiResponse<AppInfo>> {
        try {
            // Mock app information - in real implementation this would come from build process
            const appInfo: AppInfo = {
                version: '1.0.0',
                buildType: 'development',
                platform: typeof window !== 'undefined' && (window as any).electronAPI ? 'Electron' : 'Web',
                buildDate: new Date().toISOString(),
                commitHash: 'mock-commit-hash',
            };

            return createApiResponse('200', 'ok', appInfo);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Parental control password verification
    async verifyParentalPassword(password: string): Promise<ApiResponse<boolean>> {
        return new Promise(resolve => {
            setTimeout(() => {
                // Mock implementation - in real app this would check against encrypted password
                const isValid = password === '123456'; // Default parental password
                resolve(createApiResponse('200', isValid ? 'ok' : 'Invalid parental password', isValid));
            }, 500);
        });
    }

    // Load the accessible platforms - filtering by platformIds.
    async getPersonPlatforms(personId: string): Promise<
        ApiResponse<
            {
                platformId: string;
                platformNameEN: string;
                platformNameCN: string;
                url: string;
                description?: string;
            }[]
        >
    > {
        try {
            const person = await this.getPerson(personId);

            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }

            // Get platforms by IDs
            const personPlatforms = mockDataDB.platforms
                .filter(platform => person.data!.settings.platformIds.includes(platform.id))
                .map(platform => ({
                    platformId: platform.id,
                    platformNameEN: platform.nameEN,
                    platformNameCN: platform.nameCN,
                    url: platform.url,
                    description: platform.description,
                }));

            // Mock real api cost time 200ms
            await new Promise(resolve => setTimeout(resolve, 200));
            return createApiResponse('200', 'ok', personPlatforms.map(p => ({
                ...p,
                platformId: p.platformId.toString()
            })));
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }
    // Watching control APIs
    async startWatching(personId: string, platformId: string): Promise<ApiResponse<WatchingSessionResponse>> {
        try {
            const token = this.generateId();
            const person = await this.getPerson(personId);

            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }

            // Get platform specific settings
            const platform = mockDataDB.platforms.find(p => p.id === parseInt(platformId));
            if (!platform || !person.data.settings.platformIds.includes(platform.id)) {
                return createApiResponse('4002', 'Platform not allowed for this person');
            }

            // Calculate expiresAt and remaining daily time
            const todayDate = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
            const todayHistories = mockDataDB.watchingHistories.filter(h => h.date === todayDate && h.personId === parseInt(personId));
            const todayWatchedTime = todayHistories.reduce((sum, h) => sum + h.watchedTime, 0);
            const todayRemainingTime = Math.max(0, person.data.settings.dailyTimeLimitMinutes - todayWatchedTime);
            //const expiresAt = Date.now() + person.data.settings.perTimeLimitMinutes * 60 * 1000;
            // TODO: for testing
            const expiresAt = Date.now() + 8000;

            if (todayRemainingTime <= 0) {
                return createApiResponse('4017', 'Daily total time limit exceeded');
            }

            mockDataDB.watchingTokens.set(token, {
                personId: parseInt(personId),
                platformId: parseInt(platformId),
                createdAt: Date.now(),
                expiresAt: expiresAt,
                startTime: Date.now(),
                todayWatchedTime: todayWatchedTime,
                questionsAsked: 0,
            });

            return createApiResponse('200', 'ok', {
                watchingToken: token,
                sessionTimeLimit: person.data.settings.perTimeLimitMinutes,
                remainingDailyTime: todayRemainingTime,
            });
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async checkWatching(watchingToken: string): Promise<ApiResponse<WatchingStatusResponse>> {
        try {
            const watchingInfo = mockDataDB.watchingTokens.get(watchingToken);
            if (!watchingInfo) {
                return createApiResponse('4003', 'Invalid or expired token');
            }

            const person = await this.getPerson(watchingInfo.personId.toString());
            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }

            const currentTime = Date.now();
            const currentWatchedTime = currentTime - watchingInfo.startTime; // milliseconds
            let remainingTime = Math.max(0, watchingInfo.expiresAt - currentTime); // milliseconds

            // Calculate remaining daily time
            const todayDate = new Date().toISOString().split('T')[0]; // yyyy-MM-dd
            const todayHistories = mockDataDB.watchingHistories.filter(h => h.date === todayDate && h.personId === watchingInfo.personId);
            const todayWatchedTime = todayHistories.reduce((sum, h) => sum + h.watchedTime, 0) + currentWatchedTime;
            const todayRemainingTime = Math.max(0, person.data.settings.dailyTimeLimitMinutes * 60 * 1000 - todayWatchedTime);

            // Check if ForceSkip is enabled - if so, don't ask questions
            if ((watchingInfo as any).forceSkip) {
                console.log('ForceSkip is enabled for token', watchingToken, ', skipping questions');
                return createApiResponse('200', 'ok', {
                    remainingTime,
                    remainingDailyTime: todayRemainingTime,
                });
            }

            // Check if daily time exceeded
            if (todayRemainingTime <= 0) {
                return createApiResponse('4017', 'Daily total time limit exceeded', {
                    remainingTime: 0,
                    remainingDailyTime: 0,
                    dailyTimeExceeded: true,
                });
            }

            // Check if session time exceeded
            if (remainingTime <= 0) {
                const enabledSubjects = person.data.settings.subjects.filter(subject => subject.enabled).map(subject => subject.name.toLowerCase());
                const questions = generateQuestions(enabledSubjects, 'easy', person.data.settings.questionCount);

                // Store questions in the watching token for verification
                const tokenData = mockDataDB.watchingTokens.get(watchingToken);
                if (tokenData) {
                    tokenData.currentQuestions = questions;
                    mockDataDB.watchingTokens.set(watchingToken, tokenData);
                }

                return createApiResponse('4018', 'Session time limit exceeded', {
                    remainingTime: 0,
                    remainingDailyTime: todayRemainingTime,
                    questions,
                });
            }

            // Normal watching state
            return createApiResponse('200', 'ok', {
                remainingTime,
                remainingDailyTime: todayRemainingTime,
            });
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async verifyQuestion(
        watchingToken: string,
        questionId: string,
        answer: string
    ): Promise<ApiResponse<{ code: number; correct: boolean; newWatchingToken?: string }>> {
        try {
            const tokenData = mockDataDB.watchingTokens.get(watchingToken);
            if (!tokenData) {
                return createApiResponse('4003', 'Invalid or expired token');
            }

            const person = await this.getPerson(tokenData.personId.toString());
            if (person.errcode !== '200' || !person.data) {
                return createApiResponse('4001', 'Person not found');
            }

            // Find and verify question by ID
            let correct = false;
            let foundQuestion = null;

            // First try to find in question templates by ID
            foundQuestion = mockDataDB.questionTemplates.find((q: any) => q.id.toString() === questionId);

            // If not found in templates, check the current questions stored in the token
            if (!foundQuestion && tokenData.currentQuestions) {
                foundQuestion = tokenData.currentQuestions.find((q: any) => q.id.toString() === questionId);
            }

            if (foundQuestion) {
                correct = answer.toString() === foundQuestion.correctAnswer.toString();
            } else {
                console.warn('Question not found:', questionId);
                return createApiResponse('4004', 'Question not found');
            }

            if (correct) {
                // Generate new token with extended time
                const newToken = this.generateId();
                const timeLimitMs = person.data.settings.perTimeLimitMinutes * 60 * 1000; // Convert to milliseconds
                const newExpiresAt = Date.now() + timeLimitMs;

                mockDataDB.watchingTokens.set(newToken, {
                    ...tokenData,
                    expiresAt: newExpiresAt,
                    startTime: Date.now(),
                });

                mockDataDB.watchingTokens.delete(watchingToken);

                return createApiResponse('200', 'ok', {
                    code: 200,
                    correct: true,
                    newWatchingToken: newToken,
                });
            }

            return createApiResponse('200', 'ok', {
                code: 400,
                correct: false,
            });
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async skipQuestions(watchingToken: string, password: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
        try {
            const tokenData = mockDataDB.watchingTokens.get(watchingToken);
            if (!tokenData) {
                return createApiResponse('4003', 'Invalid or expired token', { success: false, message: 'Invalid or expired token' });
            }

            // Simple password check for mock (in real implementation, this would verify against parental password)
            if (password === '123456') {
                // Set forceSkip flag in token data
                (tokenData as any).forceSkip = true;
                mockDataDB.watchingTokens.set(watchingToken, tokenData);

                return createApiResponse('200', 'ok', { success: true, message: 'Questions skipped successfully' });
            } else {
                return createApiResponse('4001', 'Invalid parental password', { success: false, message: 'Invalid parental password' });
            }
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error), { success: false, message: 'Unknown error' });
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

            return createApiResponse('200', 'ok', history);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Platform management
    async getPlatforms(): Promise<ApiResponse<Platform[]>> {
        try {
            return createApiResponse('200', 'ok', mockDataDB.platforms);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async createPlatform(platformData: Partial<Platform>): Promise<ApiResponse<Platform>> {
        try {
            const newPlatform: Platform = {
                id: Math.floor(Math.random() * 1000000),
                nameEN: platformData.nameEN || '',
                nameCN: platformData.nameCN || '',
                url: platformData.url || '',
                description: platformData.description,
                ageGroups: platformData.ageGroups || ['young'],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDataDB.platforms.push(newPlatform);
            return createApiResponse('200', 'ok', newPlatform);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async updatePlatform(platformId: string, platformData: Partial<Platform>): Promise<ApiResponse<Platform>> {
        try {
            const platformIndex = mockDataDB.platforms.findIndex(p => p.id === parseInt(platformId));

            if (platformIndex === -1) {
                return createApiResponse('4001', 'Platform not found');
            }

            mockDataDB.platforms[platformIndex] = {
                ...mockDataDB.platforms[platformIndex],
                ...platformData,
                updatedAt: new Date(),
            };

            return createApiResponse('200', 'ok', mockDataDB.platforms[platformIndex]);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async deletePlatform(platformId: string): Promise<ApiResponse<void>> {
        try {
            const platformIndex = mockDataDB.platforms.findIndex(p => p.id === parseInt(platformId));

            if (platformIndex === -1) {
                return createApiResponse('4001', 'Platform not found');
            }

            mockDataDB.platforms.splice(platformIndex, 1);
            return createApiResponse('200', 'ok');
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Question template management
    async getQuestionTemplates(filters?: {
        subject?: string;
        difficulty?: string;
        ageGroup?: string;
    }): Promise<ApiResponse<QuestionTemplate[]>> {
        try {
            let templates = [...mockDataDB.questionTemplates];

            if (filters) {
                if (filters.subject) {
                    templates = templates.filter(t => t.subject === filters.subject);
                }
                if (filters.difficulty) {
                    templates = templates.filter(t => t.difficulty === filters.difficulty);
                }
                if (filters.ageGroup) {
                    templates = templates.filter(t => t.ageGroups.includes(filters.ageGroup as any));
                }
            }

            return createApiResponse('200', 'ok', templates);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async createQuestionTemplate(templateData: Partial<QuestionTemplate>): Promise<ApiResponse<QuestionTemplate>> {
        try {
            const newTemplate: QuestionTemplate = {
                id: Math.floor(Math.random() * 1000000),
                type: templateData.type || 'multiple-choice',
                subject: templateData.subject || 'math',
                difficulty: templateData.difficulty || 'medium',
                content: templateData.content || '',
                options: templateData.options,
                correctAnswer: templateData.correctAnswer || '',
                explanationEN: templateData.explanationEN,
                explanationCN: templateData.explanationCN,
                language: templateData.language || 'en',
                ageGroups: templateData.ageGroups || ['young'],
                tags: templateData.tags || [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockDataDB.questionTemplates.push(newTemplate);
            return createApiResponse('200', 'ok', newTemplate);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async updateQuestionTemplate(templateId: string, templateData: Partial<QuestionTemplate>): Promise<ApiResponse<QuestionTemplate>> {
        try {
            const templateIndex = mockDataDB.questionTemplates.findIndex(t => t.id === parseInt(templateId));

            if (templateIndex === -1) {
                return createApiResponse('4001', 'Question template not found');
            }

            mockDataDB.questionTemplates[templateIndex] = {
                ...mockDataDB.questionTemplates[templateIndex],
                ...templateData,
                updatedAt: new Date(),
            };

            return createApiResponse('200', 'ok', mockDataDB.questionTemplates[templateIndex]);
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    async deleteQuestionTemplate(templateId: string): Promise<ApiResponse<void>> {
        try {
            const templateIndex = mockDataDB.questionTemplates.findIndex(t => t.id === parseInt(templateId));

            if (templateIndex === -1) {
                return createApiResponse('4001', 'Question template not found');
            }

            mockDataDB.questionTemplates.splice(templateIndex, 1);
            return createApiResponse('200', 'ok');
        } catch (error) {
            return createApiResponse('5000', error instanceof Error ? error.message : String(error));
        }
    }

    // Helper methods
    private generateId(): string {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}
