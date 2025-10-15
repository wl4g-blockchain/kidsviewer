import React, { useState, useEffect } from 'react';
import { useSessionData } from '../components/providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { useTranslation } from '../i18n/I18nProvider';
import { Plus, Edit, Trash2, BookOpen, Filter, X, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { QuestionTemplate } from '../types';

export const QuestionManagement: React.FC = () => {
  const { data: session } = useSessionData();
  const { isDark } = useThemeStore();
  const t = useTranslation();
  const [questions, setQuestions] = useState<QuestionTemplate[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionTemplate | null>(null);
  const [filters, setFilters] = useState({
    subject: '',
    difficulty: '',
    ageGroup: '',
  });
  
  // Pagination and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Pagination calculations
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  useEffect(() => {
    loadQuestions();
  }, [currentPage, filters, searchTerm]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      
      // 构建查询参数
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.ageGroup) params.append('ageGroup', filters.ageGroup);
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await fetch(`/api/questions?${params.toString()}`);
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setQuestions(result.data);
        setFilteredQuestions(result.data);
        setTotalItems(result.pagination?.total || result.data.length);
        setTotalPages(result.pagination?.totalPages || Math.ceil(result.data.length / pageSize));
      } else {
        console.error('Failed to load questions:', result.errmsg);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQuestion = async (questionData: Partial<QuestionTemplate>) => {
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setQuestions(prev => [...prev, result.data]);
        setShowCreateModal(false);
        // 重新加载数据以获取最新状态
        loadQuestions();
      } else {
        console.error('Failed to create question:', result.errmsg);
        alert('创建问题失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to create question:', error);
      alert('创建问题失败');
    }
  };

  const handleUpdateQuestion = async (questionId: string, questionData: Partial<QuestionTemplate>) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(questionData),
      });
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setQuestions(prev => prev.map(q => (q.id === parseInt(questionId) ? result.data : q)));
        setEditingQuestion(null);
        // 重新加载数据以获取最新状态
        loadQuestions();
      } else {
        console.error('Failed to update question:', result.errmsg);
        alert('更新问题失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to update question:', error);
      alert('更新问题失败');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm(t('common.confirmDelete') || '确定要删除这个问题吗？')) return;

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.errcode === '200') {
        setQuestions(prev => prev.filter(q => q.id !== parseInt(questionId)));
        // 重新加载数据以获取最新状态
        loadQuestions();
      } else {
        console.error('Failed to delete question:', result.errmsg);
        alert('删除问题失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to delete question:', error);
      alert('删除问题失败');
    }
  };

  const clearFilters = () => {
    setFilters({ subject: '', difficulty: '', ageGroup: '' });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-blue-400' : 'border-blue-600'}`}></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 p-6 min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BookOpen className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('questionManagement.title')}</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
            isDark 
              ? 'bg-blue-600 text-white hover:bg-blue-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Plus className="w-5 h-5 mr-2" />
          {t('questionManagement.addQuestion')}
        </button>
      </div>

      {/* Search and Filters */}
      <div className={`rounded-lg shadow-md p-4 border ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('questionManagement.searchPlaceholder') || 'Search questions by content, subject, or tags...'}
              className={`w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold flex items-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Filter className="w-5 h-5 mr-2" />
            {t('questionManagement.filters') || 'Filters'}
          </h3>
          {(filters.subject || filters.difficulty || filters.ageGroup || searchTerm) && (
            <button onClick={clearFilters} className={`text-sm flex items-center transition-colors ${
              isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
            }`}>
              <X className="w-4 h-4 mr-1" />
              {t('questionManagement.clearFilters') || 'Clear Filters'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.subjects.label')}</label>
            <select
              value={filters.subject}
              onChange={e => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">{t('questionManagement.subjects.all')}</option>
              <option value="math">{t('questionManagement.subjects.math')}</option>
              <option value="chinese">{t('questionManagement.subjects.chinese')}</option>
              <option value="english">{t('questionManagement.subjects.english')}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.difficulty.label')}</label>
            <select
              value={filters.difficulty}
              onChange={e => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">{t('questionManagement.difficulty.all')}</option>
              <option value="beginner">{t('questionManagement.difficulty.beginner')}</option>
              <option value="easy">{t('questionManagement.difficulty.easy')}</option>
              <option value="medium">{t('questionManagement.difficulty.medium')}</option>
              <option value="hard">{t('questionManagement.difficulty.hard')}</option>
              <option value="expert">{t('questionManagement.difficulty.expert')}</option>
            </select>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.ageGroups.label')}</label>
            <select
              value={filters.ageGroup}
              onChange={e => setFilters(prev => ({ ...prev, ageGroup: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
              }`}
            >
              <option value="">{t('questionManagement.ageGroups.all')}</option>
              <option value="preschool">{t('questionManagement.ageGroups.preschool')}</option>
              <option value="young">{t('questionManagement.ageGroups.young')}</option>
              <option value="older">{t('questionManagement.ageGroups.older')}</option>
              <option value="teen">{t('questionManagement.ageGroups.teen')}</option>
            </select>
          </div>
        </div>

        <div className={`mt-4 flex justify-between items-center text-sm ${
          isDark ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <span>
            {t('questionManagement.showingResults', { 
              start: startIndex + 1, 
              end: Math.min(endIndex, totalItems), 
              total: totalItems,
              totalQuestions: questions.length 
            }) || `Showing ${startIndex + 1}-${Math.min(endIndex, totalItems)} of ${totalItems} questions (${questions.length} total)`}
          </span>
          {totalPages > 1 && (
            <span>
              {t('questionManagement.pageInfo', { current: currentPage, total: totalPages }) || `Page ${currentPage} of ${totalPages}`}
            </span>
          )}
        </div>
      </div>

      {/* Question List */}
      <div className="grid grid-cols-1 gap-4">
        {paginatedQuestions.map(question => (
          <div key={question.id} className={`rounded-lg shadow-md p-6 border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.subject === 'math'
                        ? 'bg-blue-100 text-blue-800'
                        : question.subject === 'chinese'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {t(`questionManagement.subjects.${question.subject}`)}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'beginner'
                        ? 'bg-gray-100 text-gray-800'
                        : question.difficulty === 'easy'
                        ? 'bg-green-100 text-green-800'
                        : question.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : question.difficulty === 'hard'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {t(`questionManagement.difficulty.${question.difficulty}`)}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {t(`questionManagement.questionTypes.${question.type}`)}
                  </span>
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{question.content}</h3>

                {question.options && (
                  <div className="mb-3">
                    <p className={`text-sm mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Options:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {question.options.map((option, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded text-xs ${
                            option === question.correctAnswer 
                              ? (isDark ? 'bg-green-900/30 text-green-300 font-medium' : 'bg-green-100 text-green-800 font-medium')
                              : (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700')
                          }`}
                        >
                          {option} {option === question.correctAnswer && '✓'}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p>
                    <strong className={isDark ? 'text-white' : 'text-gray-900'}>Correct Answer:</strong> {question.correctAnswer}
                  </p>
                  <p>
                    <strong className={isDark ? 'text-white' : 'text-gray-900'}>Age Groups:</strong> {question.ageGroups.join(', ')}
                  </p>
                  <p>
                    <strong className={isDark ? 'text-white' : 'text-gray-900'}>Tags:</strong> {question.tags.join(', ')}
                  </p>
                  {(question.explanationEN || question.explanationCN) && (
                    <p>
                      <strong className={isDark ? 'text-white' : 'text-gray-900'}>Explanation:</strong> {question.explanationEN || question.explanationCN}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button onClick={() => setEditingQuestion(question)} className={`p-2 transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-blue-400' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}>
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id.toString())}
                  className={`p-2 transition-colors ${
                    isDark 
                      ? 'text-gray-400 hover:text-red-400' 
                      : 'text-gray-500 hover:text-red-600'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700' 
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t('common.previous') || 'Previous'}
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
              // Show first page, last page, current page, and pages around current page
              const showPage = page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2;
              const showEllipsis = (page === 2 && currentPage > 4) || (page === totalPages - 1 && currentPage < totalPages - 3);

              if (!showPage && !showEllipsis) return null;

              if (showEllipsis) {
                return (
                  <span key={`ellipsis-${page}`} className={`px-3 py-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    page === currentPage
                      ? (isDark ? 'text-blue-400 bg-blue-900/30 border border-blue-600' : 'text-blue-600 bg-blue-50 border border-blue-300')
                      : (isDark ? 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50')
                  }`}
                >
                  {page}
                </button>
              );
            })}
          </div>

          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDark 
                ? 'text-gray-300 bg-gray-800 border border-gray-600 hover:bg-gray-700' 
                : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {t('common.next') || 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      )}

      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t('questionManagement.noQuestions')}</h3>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {questions.length === 0 ? t('questionManagement.noQuestionsCreated') : t('questionManagement.noQuestionsMatch')}
          </p>
          {questions.length === 0 ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('questionManagement.createFirstQuestion')}
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors ${
                isDark 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <X className="w-5 h-5 mr-2" />
              {t('questionManagement.clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingQuestion) && (
        <QuestionModal
          question={editingQuestion}
          onSave={editingQuestion ? data => handleUpdateQuestion(editingQuestion.id.toString(), data) : handleCreateQuestion}
          onClose={() => {
            setShowCreateModal(false);
            setEditingQuestion(null);
          }}
        />
      )}
    </div>
  );
};

// Question Modal Component
interface QuestionModalProps {
  question?: QuestionTemplate | null;
  onSave: (data: Partial<QuestionTemplate>) => void;
  onClose: () => void;
}

const QuestionModal: React.FC<QuestionModalProps> = ({ question, onSave, onClose }) => {
  const { isDark } = useThemeStore();
  const t = useTranslation();
  const [formData, setFormData] = useState({
    type: question?.type || ('multiple-choice' as const),
    subject: question?.subject || 'math',
    difficulty: question?.difficulty || ('medium' as const),
    content: question?.content || '',
    options: question?.options || ['', '', '', ''],
    correctAnswer: question?.correctAnswer || '',
    explanationEN: question?.explanationEN || '',
    explanationCN: question?.explanationCN || '',
    language: question?.language || 'en',
    ageGroups: question?.ageGroups || (['young'] as ('preschool' | 'young' | 'older' | 'teen')[]),
    tags: question?.tags ? question.tags.join(', ') : '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: Partial<QuestionTemplate> = {
      ...formData,
      options: formData.type === 'multiple-choice' ? formData.options.filter(opt => opt.trim()) : undefined,
      tags: formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag),
    };

    onSave(submitData);
  };

  const handleAgeGroupChange = (ageGroup: 'preschool' | 'young' | 'older' | 'teen') => {
    setFormData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(ageGroup) ? prev.ageGroups.filter(ag => ag !== ageGroup) : [...prev.ageGroups, ageGroup],
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {question ? t('questionManagement.modal.edit') : t('questionManagement.modal.create')}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
          }`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.questionType')}</label>
              <select
                value={formData.type}
                onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="multiple-choice">{t('questionManagement.questionTypes.multiple-choice')}</option>
                <option value="true-false">{t('questionManagement.questionTypes.true-false')}</option>
                <option value="fill-blank">{t('questionManagement.questionTypes.fill-blank')}</option>
                <option value="calculation">{t('questionManagement.questionTypes.calculation')}</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.subjects.label')}</label>
              <select
                value={formData.subject}
                onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="math">{t('questionManagement.subjects.math')}</option>
                <option value="chinese">{t('questionManagement.subjects.chinese')}</option>
                <option value="english">{t('questionManagement.subjects.english')}</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.difficulty.label')}</label>
              <select
                value={formData.difficulty}
                onChange={e => setFormData(prev => ({ ...prev, difficulty: e.target.value as any }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white focus:ring-blue-400 focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                }`}
              >
                <option value="beginner">{t('questionManagement.difficulty.beginner')}</option>
                <option value="easy">{t('questionManagement.difficulty.easy')}</option>
                <option value="medium">{t('questionManagement.difficulty.medium')}</option>
                <option value="hard">{t('questionManagement.difficulty.hard')}</option>
                <option value="expert">{t('questionManagement.difficulty.expert')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.questionContent')}</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              rows={3}
              required
            />
          </div>

          {formData.type === 'multiple-choice' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.options')}</label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={e => handleOptionChange(index, e.target.value)}
                    placeholder={`${t('common.option') || 'Option'} ${index + 1}`}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.correctAnswer')}</label>
            <input
              type="text"
              value={formData.correctAnswer}
              onChange={e => setFormData(prev => ({ ...prev, correctAnswer: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.ageGroupsLabel')}</label>
            <div className="flex space-x-4">
              {(['preschool', 'young', 'older', 'teen'] as const).map(ageGroup => (
                <label key={ageGroup} className={`flex items-center ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={formData.ageGroups.includes(ageGroup)}
                    onChange={() => handleAgeGroupChange(ageGroup)}
                    className="mr-2"
                  />
                  {t(`questionManagement.ageGroups.${ageGroup}`)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.tags')}</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder={t('questionManagement.modal.tagsPlaceholder')}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.explanationEN')}</label>
            <textarea
              value={formData.explanationEN}
              onChange={e => setFormData(prev => ({ ...prev, explanationEN: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              rows={2}
              placeholder={t('questionManagement.modal.explanationENPlaceholder')}
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{t('questionManagement.modal.explanationCN')}</label>
            <textarea
              value={formData.explanationCN}
              onChange={e => setFormData(prev => ({ ...prev, explanationCN: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              rows={2}
              placeholder={t('questionManagement.modal.explanationCNPlaceholder')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className={`px-4 py-2 border rounded-md transition-colors ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              {t('common.cancel')}
            </button>
            <button type="submit" className={`px-4 py-2 rounded-md transition-colors ${
              isDark 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              {question ? t('questionManagement.modal.update') : t('questionManagement.modal.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
