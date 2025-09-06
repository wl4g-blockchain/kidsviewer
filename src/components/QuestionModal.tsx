import React from 'react';
import { useTranslation } from '../i18n/I18nProvider';

export interface Question {
  id: string;
  question: string;
  options: string[];
}

interface QuestionModalProps {
  question: Question;
  onAnswer: (questionId: string, answer: string) => void;
  isVisible: boolean;
}

/**
 * Shared question modal component used by both ElectronWebViewer and IOSWebViewer
 * Displays a question with multiple choice options
 */
export const QuestionModal: React.FC<QuestionModalProps> = ({ question, onAnswer, isVisible }) => {
  const t = useTranslation();

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 text-white p-6 z-20">
      <h3 className="text-xl font-bold mb-2">{t('person.unlockToContinue')}</h3>
      <p className="text-gray-300 text-center mb-6">{t('questions.answerToResume')}</p>

      <div className="max-w-md w-full space-y-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-center mb-4">{question.question}</p>
          <div className="grid grid-cols-2 gap-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswer(question.id, option)}
                className="p-3 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-center text-gray-400">{t('questions.correctAnswerNeeded')}</p>
      </div>
    </div>
  );
};

/**
 * Component for displaying multiple questions in sequence
 */
export const QuestionsContainer: React.FC<{
  questions: Question[];
  onAnswer: (questionId: string, answer: string) => void;
  isVisible: boolean;
}> = ({ questions, onAnswer, isVisible }) => {
  // const t = useTranslation();

  if (!isVisible || questions.length === 0) return null;

  // Display the first question in the list
  return <QuestionModal question={questions[0]} onAnswer={onAnswer} isVisible={isVisible} />;
};
