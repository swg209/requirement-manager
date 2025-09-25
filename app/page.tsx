'use client';

import { useState } from 'react';
import RequirementManager from '@/components/RequirementManager';
import ArchitectureCanvas from '@/components/ArchitectureCanvas';
import ComponentManager from '@/components/ComponentManager';
import RequirementTracking from '@/components/RequirementTracking';
import ProjectSelector from '@/components/ProjectSelector';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'requirements' | 'architecture' | 'components' | 'tracking'>('requirements');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const tabs = [
    { id: 'requirements', label: '需求管理' },
    { id: 'architecture', label: '系统架构' },
    { id: 'components', label: '组件管理' },
    { id: 'tracking', label: '需求追踪' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">需求管理平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <ProjectSelector 
                selectedProjectId={selectedProjectId}
                onProjectChange={setSelectedProjectId}
              />
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 标签导航 */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 bg-white rounded-lg shadow">
          {activeTab === 'requirements' && selectedProjectId && (
            <RequirementManager projectId={selectedProjectId} />
          )}
          {activeTab === 'architecture' && selectedProjectId && (
            <ArchitectureCanvas projectId={selectedProjectId} />
          )}
          {activeTab === 'components' && selectedProjectId && (
            <ComponentManager projectId={selectedProjectId} />
          )}
          {activeTab === 'tracking' && selectedProjectId && (
              <RequirementTracking projectId={selectedProjectId} />
            )}
          {!selectedProjectId && (
            <div className="p-8 text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">请选择项目</h3>
              <p>选择一个项目开始管理需求和架构</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
