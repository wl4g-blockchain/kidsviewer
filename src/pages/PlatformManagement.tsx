import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
// import { useTranslation } from '../i18n/I18nProvider'; // TODO: Add i18n support
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { Platform } from '../types';

export const PlatformManagement: React.FC = () => {
  const { apiHandler } = useAuthStore();
  // const t = useTranslation(); // TODO: Add i18n support for platform management
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
      const response = await apiHandler.getPlatforms();
      if (response.errcode === '200' && response.data) {
        setPlatforms(response.data);
      }
    } catch (error) {
      console.error('Failed to load platforms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlatform = async (platformData: Partial<Platform>) => {
    try {
      const response = await apiHandler.createPlatform(platformData);
      if (response.errcode === '200' && response.data) {
        setPlatforms(prev => [...prev, response.data!]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create platform:', error);
    }
  };

  const handleUpdatePlatform = async (platformId: string, platformData: Partial<Platform>) => {
    try {
      const response = await apiHandler.updatePlatform(platformId, platformData);
      if (response.errcode === '200' && response.data) {
        setPlatforms(prev => prev.map(p => (p.id === parseInt(platformId) ? response.data! : p)));
        setEditingPlatform(null);
      }
    } catch (error) {
      console.error('Failed to update platform:', error);
    }
  };

  const handleDeletePlatform = async (platformId: string) => {
    if (!confirm('Are you sure you want to delete this platform?')) return;

    try {
      const response = await apiHandler.deletePlatform(platformId);
      if (response.errcode === '200') {
        setPlatforms(prev => prev.filter(p => p.id !== parseInt(platformId)));
      }
    } catch (error) {
      console.error('Failed to delete platform:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Globe className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Platform Management</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Platform
        </button>
      </div>

      {/* Platform List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map(platform => (
          <div key={platform.id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{platform.nameEN}</h3>
              <div className="flex items-center space-x-2">
                <button onClick={() => setEditingPlatform(platform)} className="p-2 text-gray-500 hover:text-blue-600 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeletePlatform(platform.id.toString())}
                  className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p>
                <strong>Chinese Name:</strong> {platform.nameCN}
              </p>
              <p>
                <strong>URL:</strong>{' '}
                <a href={platform.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {platform.url}
                </a>
              </p>
              <p>
                <strong>Age Groups:</strong> {platform.ageGroups.join(', ')}
              </p>
              {platform.description && (
                <p>
                  <strong>Description:</strong> {platform.description}
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
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{platform ? 'Edit Platform' : 'Create Platform'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">English Name</label>
              <input
                type="text"
                value={formData.nameEN}
                onChange={e => setFormData(prev => ({ ...prev, nameEN: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Chinese Name</label>
              <input
                type="text"
                value={formData.nameCN}
                onChange={e => setFormData(prev => ({ ...prev, nameCN: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups</label>
            <div className="flex space-x-4">
              {(['preschool', 'young', 'older'] as const).map(ageGroup => (
                <label key={ageGroup} className="flex items-center">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              {platform ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
