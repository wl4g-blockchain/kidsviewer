import React, { useEffect, useState } from 'react';
import { useTranslation } from '../i18n/I18nProvider';
import './AnswerFeedbackAnimation.css';

interface AnswerFeedbackAnimationProps {
  isCorrect: boolean;
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

/**
 * Answer feedback animation component
 * Contains encouragement animation for incorrect answers and celebration animation for correct answers
 */
export const AnswerFeedbackAnimation: React.FC<AnswerFeedbackAnimationProps> = ({
  isCorrect,
  isVisible,
  onAnimationComplete
}) => {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShowAnimation(true);
      // Animation duration
      const duration = isCorrect ? 2000 : 1500;
      const timer = setTimeout(() => {
        setShowAnimation(false);
        onAnimationComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, isCorrect, onAnimationComplete]);

  if (!isVisible || !showAnimation) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100000] pointer-events-none">
      {isCorrect ? (
        <CorrectAnswerAnimation />
      ) : (
        <IncorrectAnswerAnimation />
      )}
    </div>
  );
};

/**
 * Correct answer celebration animation
 */
const CorrectAnswerAnimation: React.FC = () => {
  const t = useTranslation();
  const [encouragementMessage, setEncouragementMessage] = useState('');

  useEffect(() => {
    const messages = t('questionModal.encouragement.correct');
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setEncouragementMessage(randomMessage);
  }, [t]);

  return (
    <div className="relative">
      {/* Fireworks effect */}
      <div className="fireworks-container">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className={`firework firework-${i + 1}`}
            style={{
              '--delay': `${i * 0.1}s`,
              '--angle': `${i * 45}deg`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Cat celebration animation */}
      <div className="cat-celebration">
        <div className="cat-face">
          <div className="cat-ears">
            <div className="cat-ear left"></div>
            <div className="cat-ear right"></div>
          </div>
          <div className="cat-eyes">
            <div className="cat-eye left">
              <div className="cat-pupil"></div>
            </div>
            <div className="cat-eye right">
              <div className="cat-pupil"></div>
            </div>
          </div>
          <div className="cat-nose"></div>
          <div className="cat-mouth">
            <div className="cat-smile"></div>
          </div>
        </div>
        <div className="cat-whiskers">
          <div className="whisker left"></div>
          <div className="whisker right"></div>
        </div>
      </div>

      {/* Stars effect */}
      <div className="stars-container">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`star star-${i + 1}`}
            style={{
              '--delay': `${i * 0.1}s`,
              '--angle': `${i * 30}deg`
            } as React.CSSProperties}
          >
            ⭐
          </div>
        ))}
      </div>

      {/* Success text */}
      <div className="success-text">
        <div className="success-message">{encouragementMessage}</div>
        <div className="success-subtitle">🎉 {t('questionModal.encouragement.keepGoing')}</div>
      </div>
    </div>
  );
};

/**
 * Incorrect answer encouragement animation
 */
const IncorrectAnswerAnimation: React.FC = () => {
  const t = useTranslation();
  const [encouragementMessage, setEncouragementMessage] = useState('');

  useEffect(() => {
    const messages = t('questionModal.encouragement.incorrect');
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setEncouragementMessage(randomMessage);
  }, [t]);

  return (
    <div className="relative">
      {/* Dog encouragement animation */}
      <div className="dog-encouragement">
        <div className="dog-face">
          <div className="dog-ears">
            <div className="dog-ear left"></div>
            <div className="dog-ear right"></div>
          </div>
          <div className="dog-eyes">
            <div className="dog-eye left">
              <div className="dog-pupil"></div>
            </div>
            <div className="dog-eye right">
              <div className="dog-pupil"></div>
            </div>
          </div>
          <div className="dog-nose"></div>
          <div className="dog-mouth">
            <div className="dog-tongue"></div>
          </div>
        </div>
        <div className="dog-tail"></div>
      </div>

      {/* Encouragement text */}
      <div className="encouragement-text">
        <div className="encouragement-message">{encouragementMessage}</div>
        <div className="encouragement-subtitle">💪 {t('questionModal.encouragement.tryAgain')}</div>
      </div>

      {/* Heartbeat effect */}
      <div className="heartbeat-container">
        <div className="heartbeat">💓</div>
      </div>
    </div>
  );
};

export default AnswerFeedbackAnimation;
