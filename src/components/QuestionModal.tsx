import React, { useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import { X } from 'lucide-react';
import { ParentalPasswordModal } from './ParentalPasswordModal';
import AnswerFeedbackAnimation from './AnswerFeedbackAnimation';
import { APIFactory } from '../services/APIFactory';

export interface Question {
  id: string;
  question: string;
  options?: string[];
  type?: 'multiple-choice' | 'true-false' | 'fill-blank' | 'calculation';
  correctAnswer?: string | number;
}

interface QuestionModalProps {
  question: Question;
  onAnswer: (questionId: string, answer: string) => Promise<boolean>; // Return whether answer is correct
  isVisible: boolean;
}

/**
 * Shared question modal component used by both ElectronWebViewer and IOSWebViewer
 * Displays a question with multiple choice options in a white panel style
 */
export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer, isVisible }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [correctAnswer, setCorrectAnswer] = useState<string>('');
  const t = useTranslation();

  if (!isVisible) return null;

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    // Call the parent's onAnswer function - let parent handle validation
    onAnswer(question.id, selectedAnswer);
    
    // Show result based on parent's response
    const isAnswerCorrect = selectedAnswer === correctAnswer.toString();
    setIsCorrect(isAnswerCorrect);
    setCorrectAnswer(selectedAnswer);
    setShowResult(true);
    
    // Auto-hide result after 3 seconds and reset for next question
    setTimeout(() => {
      setShowResult(false);
      setSelectedAnswer('');
      setIsCorrect(false);
      setCorrectAnswer('');
    }, 3000);
  };

  // Generate options for calculation questions
  const generateCalculationOptions = (correctAnswer: number): string[] => {
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
  };

  const getQuestionOptions = (): string[] => {
    if (question.options && question.options.length > 0) {
      return question.options;
    }
    
    if (question.type === 'calculation' && question.correctAnswer) {
      return generateCalculationOptions(Number(question.correctAnswer));
    }
    
    return [];
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-6 z-[99999]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❓</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('questionModal.title')}</h3>
          <p className="text-gray-600">{t('questionModal.subtitle')}</p>
        </div>

        {/* Question */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {question.question}
          </h4>
          
          {/* Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getQuestionOptions().map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedAnswer === option
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 ${
              selectedAnswer
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t('common.submit')}
          </button>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className={`text-center p-4 rounded-lg ${
            isCorrect 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">
                {isCorrect ? '✅' : '❌'}
              </span>
              <span className={`text-lg font-semibold ${
                isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {isCorrect ? t('questionModal.correct') : t('questionModal.incorrect')}
              </span>
            </div>
            <p className={`text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {t('questionModal.yourAnswer')}: {correctAnswer}
            </p>
            {!isCorrect && (
              <p className="text-sm text-red-600 mt-1">
                {t('questionModal.correctAnswerWillShow')}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <p className="text-sm text-gray-500 text-center">
          {t('questionModal.instruction')}
        </p>
      </div>
    </div>
  );
};

/**
 * Component for displaying multiple questions in sequence
 */
export const QuestionsContainer: React.FC<{
  questions: Question[];
  onAnswer: (questionId: string, answer: string) => Promise<boolean>; // Return whether answer is correct
  isVisible: boolean;
  onAllQuestionsCompleted?: () => void;
  onSkipQuestions?: (password: string) => Promise<void>; // Callback for skipping questions with password
  watchingToken?: string; // Watching token for API calls
}> = ({ questions, onAnswer, isVisible, onAllQuestionsCompleted, onSkipQuestions, watchingToken }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationCorrect, setAnimationCorrect] = useState(false);
  const t = useTranslation();

  if (!isVisible || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  // Add safety check for currentQuestion
  if (!currentQuestion) {
    return null;
  }

  // Generate options for calculation questions
  const generateCalculationOptions = (correctAnswer: number): string[] => {
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
  };

  const getQuestionOptions = (): string[] => {
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      return currentQuestion.options;
    }
    
    if (currentQuestion.type === 'calculation' && currentQuestion.correctAnswer) {
      return generateCalculationOptions(Number(currentQuestion.correctAnswer));
    }
    
    return [];
  };

  const handleAnswer = async (questionId: string, answer: string) => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('Already submitting, ignoring duplicate submission');
      return;
    }
    
    setUserAnswer(answer);
    setIsSubmitting(true);
    
    // Call the parent's onAnswer function and wait for response
    try {
      const isAnswerCorrect = await onAnswer(questionId, answer);
      console.log('QuestionModal: Received answer result:', isAnswerCorrect);
      
      // 触发动画
      setAnimationCorrect(isAnswerCorrect);
      setShowAnimation(true);
      
      setIsCorrect(isAnswerCorrect);
      setShowResult(true);
      
      // Auto-hide result after 1.5 seconds
      setTimeout(() => {
        setShowResult(false);
        setUserAnswer('');
        setIsCorrect(false);
        setIsSubmitting(false);
        setShowAnimation(false); // ensure animation is hidden
        
        // Only move to next question if answer is correct
        if (isAnswerCorrect) {
          if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
          } else {
            // All questions answered, close modal
            setCurrentQuestionIndex(0);
            onAllQuestionsCompleted?.();
          }
        }
        // If answer is incorrect, stay on the same question for retry
      }, 500);
    } catch (error) {
      console.error('Error submitting answer:', error);
      setIsSubmitting(false);
      setShowAnimation(false); // ensure animation is hidden when error
      // On error, stay on the same question for retry
    }
  };

  const handleAnswerSelect = (answer: string) => {
    setUserAnswer(answer);
  };

  // Handle skip questions with password verification
  const handleSkipQuestions = () => {
    setShowPasswordModal(true);
    setPasswordError('');
  };

  // Handle password submission for skipping questions
  const handlePasswordSubmit = async (password: string) => {
    try {
      if (onSkipQuestions) {
        // Use the callback if provided
        await onSkipQuestions(password);
        setShowPasswordModal(false);
      } else if (watchingToken) {
        // Fallback to direct API call
        const apiHandler = APIFactory.createAPIHandler();
        
        // Use the API to verify parental password and skip questions
        const response = await apiHandler.skipQuestions(watchingToken, password);
        
        if (response.errcode === '200' && response.data?.success) {
          setShowPasswordModal(false);
        } else {
          setPasswordError(response.data?.message || t('common.incorrectPassword'));
        }
      } else {
        setPasswordError('Watching token not available');
      }
    } catch (error) {
      setPasswordError(t('common.passwordError'));
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50 p-6 z-[99999]">
      {/* answer feedback animation */}
      <AnswerFeedbackAnimation
        isCorrect={animationCorrect}
        isVisible={showAnimation}
        onAnimationComplete={() => setShowAnimation(false)}
      />
      
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
        {/* Close Button */}
        <button
          onClick={handleSkipQuestions}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title={t('questionModal.skipQuestions')}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6 pr-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❓</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('questionModal.title')}</h3>
          <p className="text-gray-600">{t('questionModal.subtitle')}</p>
          
          {/* Question Progress */}
          <div className="mt-4">
            <p className="text-sm text-gray-500 text-center mb-2">{t('questionModal.questionOf', { current: currentQuestionIndex + 1, total: questions.length })}</p>
            <div className="flex items-center justify-center space-x-2">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index < currentQuestionIndex 
                      ? 'bg-green-500' 
                      : index === currentQuestionIndex 
                      ? 'bg-blue-500' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Question */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            {currentQuestion.question}
          </h4>
          
          {/* Answer Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {getQuestionOptions().map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  userAnswer === option
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="font-medium">{option}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={() => handleAnswer(currentQuestion.id, userAnswer)}
            disabled={!userAnswer || isSubmitting}
            className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center ${
              userAnswer && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {t('common.submitting')}
              </>
            ) : (
              t('questionModal.submitAnswer')
            )}
          </button>
        </div>

        {/* Result Display */}
        {showResult && (
          <div className={`text-center p-4 rounded-lg mb-4 ${
            isCorrect 
              ? 'bg-green-50 border-2 border-green-200' 
              : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className="flex items-center justify-center mb-2">
              <span className="text-2xl mr-2">
                {isCorrect ? '✅' : '❌'}
              </span>
              <span className={`text-lg font-semibold ${
                isCorrect ? 'text-green-800' : 'text-red-800'
              }`}>
                {isCorrect ? t('questionModal.correct') : t('questionModal.incorrect')}
              </span>
            </div>
            <p className={`text-sm ${
              isCorrect ? 'text-green-700' : 'text-red-700'
            }`}>
              {t('questionModal.yourAnswer')}: {userAnswer}
            </p>
            {!isCorrect && (
              <p className="text-sm text-red-600 mt-1">
                {t('questionModal.pleaseSelectCorrectAnswer')}
              </p>
            )}
          </div>
        )}

        {/* Instructions */}
        <p className="text-sm text-gray-500 text-center">
          {t('questionModal.instruction')}
        </p>
      </div>

      {/* Parental Password Modal */}
      <div className="relative z-[100000]">
        <ParentalPasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          onSubmit={handlePasswordSubmit}
          error={passwordError}
        />
      </div>
    </div>
  );
};
