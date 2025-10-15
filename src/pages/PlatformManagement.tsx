import React, { useState, useEffect } from 'react';
import { useSessionData } from '../components/providers/AuthProvider';
import { useThemeStore } from '../stores/themeStore';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { Platform } from '../types';

export const PlatformManagement: React.FC = () => {
  const { data: session } = useSessionData();
  const { isDark } = useThemeStore();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);

  useEffect(() => {
    loadPlatforms();
  }, []);

  const loadPlatforms = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/platforms');
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setPlatforms(result.data);
      } else {
        console.error('Failed to load platforms:', result.errmsg);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlatform = async (platformData: Partial<Platform>) => {
    try {
      const response = await fetch('/api/platforms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(platformData),
      });
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setPlatforms(prev => [...prev, result.data]);
        setShowCreateModal(false);
      } else {
        console.error('Failed to create platform:', result.errmsg);
        alert('创建平台失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to create platform:', error);
      alert('创建平台失败');
    }
  };

  const handleUpdatePlatform = async (platformId: string, platformData: Partial<Platform>) => {
    try {
      const response = await fetch(`/api/platforms/${platformId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(platformData),
      });
      const result = await response.json();
      
      if (result.errcode === '200' && result.data) {
        setPlatforms(prev => prev.map(p => (p.id === parseInt(platformId) ? result.data : p)));
        setEditingPlatform(null);
      } else {
        console.error('Failed to update platform:', result.errmsg);
        alert('更新平台失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to update platform:', error);
      alert('更新平台失败');
    }
  };

  const handleDeletePlatform = async (platformId: string) => {
    if (!confirm('确定要删除这个平台吗？')) return;

    try {
      const response = await fetch(`/api/platforms/${platformId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      
      if (result.errcode === '200') {
        setPlatforms(prev => prev.filter(p => p.id !== parseInt(platformId)));
      } else {
        console.error('Failed to delete platform:', result.errmsg);
        alert('删除平台失败: ' + result.errmsg);
      }
    } catch (error) {
      console.error('Failed to delete platform:', error);
      alert('删除平台失败');
    }
  };

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
          <Globe className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Platform Management</h1>
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
          Add Platform
        </button>
      </div>

      {/* Platform List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map(platform => (
          <div key={platform.id} className={`rounded-lg shadow-md p-6 border ${
            isDark 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{platform.nameEN}</h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingPlatform(platform)} className={`p-2 transition-colors ${
                  isDark 
                    ? 'text-gray-400 hover:text-blue-400' 
                    : 'text-gray-500 hover:text-blue-600'
                }`}>
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlatform(platform.id.toString())}
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

            <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <p>
                <strong className={isDark ? 'text-white' : 'text-gray-900'}>Chinese Name:</strong> {platform.nameCN}
              </p>
              <p>
                <strong className={isDark ? 'text-white' : 'text-gray-900'}>URL:</strong>{' '}
                <a href={platform.url} target="_blank" rel="noopener noreferrer" className={`hover:underline ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {platform.url}
                </a>
              </p>
              <p>
                <strong className={isDark ? 'text-white' : 'text-gray-900'}>Age Groups:</strong> {platform.ageGroups.join(', ')}
              </p>
              {platform.description && (
                <p>
                  <strong className={isDark ? 'text-white' : 'text-gray-900'}>Description:</strong> {platform.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingPlatform) && (
        <PlatformModal
          platform={editingPlatform}
          onSave={editingPlatform ? data => handleUpdatePlatform(editingPlatform.id.toString(), data) : handleCreatePlatform}
          onClose={() => {
            setShowCreateModal(false);
            setEditingPlatform(null);
          }}
        />
      )}
    </div>
  );
};

// Platform Modal Component
interface PlatformModalProps {
  platform?: Platform | null;
  onSave: (data: Partial<Platform>) => void;
  onClose: () => void;
}

const PlatformModal: React.FC<PlatformModalProps> = ({ platform, onSave, onClose }) => {
  const { isDark } = useThemeStore();
  const [formData, setFormData] = useState({
    nameEN: platform?.nameEN || '',
    nameCN: platform?.nameCN || '',
    url: platform?.url || '',
    description: platform?.description || '',
    ageGroups: platform?.ageGroups || (['young'] as ('preschool' | 'young' | 'older')[]),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleAgeGroupChange = (ageGroup: 'preschool' | 'young' | 'older') => {
    setFormData(prev => ({
      ...prev,
      ageGroups: prev.ageGroups.includes(ageGroup) ? prev.ageGroups.filter(ag => ag !== ageGroup) : [...prev.ageGroups, ageGroup],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {platform ? 'Edit Platform' : 'Create Platform'}
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${
            isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
          }`}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>English Name</label>
              <input
                type="text"
                value={formData.nameEN}
                onChange={e => setFormData(prev => ({ ...prev, nameEN: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Chinese Name</label>
              <input
                type="text"
                value={formData.nameCN}
                onChange={e => setFormData(prev => ({ ...prev, nameCN: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
                }`}
                required
              />
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              required
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Age Groups</label>
            <div className="flex space-x-4">
              {(['preschool', 'young', 'older'] as const).map(ageGroup => (
                <label key={ageGroup} className={`flex items-center ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={formData.ageGroups.includes(ageGroup)}
                    onChange={() => handleAgeGroupChange(ageGroup)}
                    className="mr-2"
                  />
                  {ageGroup.charAt(0).toUpperCase() + ageGroup.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-400 focus:border-blue-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500'
              }`}
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className={`px-4 py-2 border rounded-md transition-colors ${
              isDark 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              Cancel
            </button>
            <button type="submit" className={`px-4 py-2 rounded-md transition-colors ${
              isDark 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}>
              {platform ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
