'use client';

import { useState, useEffect } from 'react';
import { supabaseDb } from '@/lib/supabase-database';
import { Requirement } from '@/lib/database';

interface RequirementManagerProps {
  projectId: string;
}

export default function RequirementManager({ projectId }: RequirementManagerProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');

  // 新建/编辑需求的表单状态
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'blocked',
    category: '',
    assignee: '',
    estimatedHours: 0,
  });

  useEffect(() => {
    if (projectId) {
      loadRequirements();
    }
  }, [projectId]);

  const loadRequirements = async () => {
    if (!projectId) return;
    
    try {
      const allRequirements = await supabaseDb.getRequirements();
      const projectRequirements = allRequirements.filter(req => req.projectId === projectId);
      
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const filtered = projectRequirements.filter(req => 
          req.title.toLowerCase().includes(lowerQuery) ||
          req.description.toLowerCase().includes(lowerQuery) ||
          req.category.toLowerCase().includes(lowerQuery)
        );
        setRequirements(filtered);
      } else {
        setRequirements(projectRequirements);
      }
    } catch (error) {
      console.error('Failed to load requirements:', error);
    }
  };

  useEffect(() => {
    loadRequirements();
  }, [searchQuery, projectId]);

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      category: '',
      assignee: '',
      estimatedHours: 0,
    });
    setEditingRequirement(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async () => {
    if (!projectId || !formData.title.trim()) return;

    try {
      if (editingRequirement) {
        // 更新需求
        await supabaseDb.updateRequirement(editingRequirement.id, {
          ...formData,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          assignee: formData.assignee.trim() || undefined,
          estimatedHours: formData.estimatedHours || undefined,
        });
      } else {
        // 创建新需求
        await supabaseDb.createRequirement({
          ...formData,
          projectId,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category: formData.category.trim(),
          assignee: formData.assignee.trim() || undefined,
          estimatedHours: formData.estimatedHours || undefined,
        });
      }

      resetForm();
      loadRequirements();
    } catch (error) {
      console.error('Failed to save requirement:', error);
    }
  };

  const handleEdit = (requirement: Requirement) => {
    setFormData({
      title: requirement.title,
      description: requirement.description,
      priority: requirement.priority,
      status: requirement.status,
      category: requirement.category,
      assignee: requirement.assignee || '',
      estimatedHours: requirement.estimatedHours || 0,
    });
    setEditingRequirement(requirement);
    setShowCreateForm(true);
  };

  const handleDelete = async (requirement: Requirement) => {
    if (window.confirm('确定要删除这个需求吗？')) {
      try {
        await supabaseDb.deleteRequirement(requirement.id);
        loadRequirements();
      } catch (error) {
        console.error('Failed to delete requirement:', error);
      }
    }
  };

  const handleBatchImport = async () => {
    if (!projectId || !importData.trim()) return;

    try {
      // 简单的CSV解析（标题,描述,优先级,分类）
      const lines = importData.trim().split('\n');
      const requirements = lines.map(line => {
        const [title, description = '', priority = 'medium', category = ''] = line.split(',').map(s => s.trim());
        return {
          projectId,
          title,
          description,
          priority: (priority as 'high' | 'medium' | 'low') || 'medium',
          status: 'pending' as const,
          category,
        };
      }).filter(req => req.title);

      for (const requirement of requirements) {
        await supabaseDb.createRequirement(requirement);
      }
      setImportData('');
      setShowImportModal(false);
      loadRequirements();
    } catch (error) {
      alert('导入失败，请检查数据格式');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in_progress': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!projectId) {
    return (
      <div className="p-8 text-center text-gray-500">
        请先选择一个项目来管理需求
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <input
            type="text"
            placeholder="搜索需求..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            📥 批量导入
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            + 新建需求
          </button>
        </div>
      </div>

      {/* 需求列表 */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {requirements.map((requirement) => (
            <li key={requirement.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {requirement.title}
                    </h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(requirement.priority)}`}>
                      {requirement.priority === 'high' ? '高' : requirement.priority === 'medium' ? '中' : '低'}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(requirement.status)}`}>
                      {requirement.status === 'pending' ? '待处理' : 
                       requirement.status === 'in_progress' ? '进行中' :
                       requirement.status === 'completed' ? '已完成' : '阻塞'}
                    </span>
                  </div>
                  
                  <p className="mt-1 text-sm text-gray-600">
                    {requirement.description}
                  </p>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                    {requirement.category && (
                      <span>📂 {requirement.category}</span>
                    )}
                    {requirement.assignee && (
                      <span>👤 {requirement.assignee}</span>
                    )}
                    {requirement.estimatedHours && (
                      <span>⏱️ {requirement.estimatedHours}h</span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEdit(requirement)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(requirement)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {requirements.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? '没有找到匹配的需求' : '暂无需求，点击"新建需求"开始添加'}
          </div>
        )}
      </div>

      {/* 创建/编辑需求表单 */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRequirement ? '编辑需求' : '新建需求'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入需求标题"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="输入需求描述"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">优先级</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">待处理</option>
                      <option value="in_progress">进行中</option>
                      <option value="completed">已完成</option>
                      <option value="blocked">阻塞</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="如：用户管理、商品管理等"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">负责人</label>
                    <input
                      type="text"
                      value={formData.assignee}
                      onChange={(e) => setFormData({...formData, assignee: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="负责人姓名"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">预估工时</label>
                    <input
                      type="number"
                      value={formData.estimatedHours}
                      onChange={(e) => setFormData({...formData, estimatedHours: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="小时"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.title.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRequirement ? '更新' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">批量导入需求</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  数据格式：标题,描述,优先级,分类（每行一个需求）
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="用户注册,实现用户注册功能,high,用户管理&#10;商品列表,显示商品列表页面,medium,商品管理"
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchImport}
                  disabled={!importData.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}