'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Link, Unlink } from 'lucide-react';
import { supabaseDb } from '@/lib/supabase-database';
import { Component, Requirement, RequirementComponentMapping } from '@/lib/database';

interface ComponentManagerProps {
  projectId: string;
}

export default function ComponentManager({ projectId }: ComponentManagerProps) {
  const [components, setComponents] = useState<Component[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [mappings, setMappings] = useState<RequirementComponentMapping[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [selectedRequirements, setSelectedRequirements] = useState<string[]>([]);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const allComponents = await supabaseDb.getComponents();
      const allRequirements = await supabaseDb.getRequirements();
      const allMappings = await supabaseDb.getRequirementComponentMappings();
      
      setComponents(allComponents.filter(comp => comp.projectId === projectId));
      setRequirements(allRequirements.filter(req => req.projectId === projectId));
      setMappings(allMappings);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  // 获取组件关联的需求
  const getComponentRequirements = (componentId: string) => {
    const componentMappings = mappings.filter(m => m.componentId === componentId);
    return requirements.filter(req => 
      componentMappings.some(mapping => mapping.requirementId === req.id)
    );
  };

  // 获取需求关联的组件
  const getRequirementComponents = (requirementId: string) => {
    const requirementMappings = mappings.filter(m => m.requirementId === requirementId);
    return components.filter(comp => 
      requirementMappings.some(mapping => mapping.componentId === comp.id)
    );
  };

  // 打开映射模态框
  const openMappingModal = (component: Component) => {
    setSelectedComponent(component);
    const componentRequirements = getComponentRequirements(component.id);
    setSelectedRequirements(componentRequirements.map(req => req.id));
    setShowMappingModal(true);
  };

  // 保存需求映射
  const saveMappings = async () => {
    if (!selectedComponent) return;

    try {
      // 删除现有映射
      const existingMappings = mappings.filter(m => m.componentId === selectedComponent.id);
      for (const mapping of existingMappings) {
        await supabaseDb.deleteRequirementComponentMapping(mapping.id);
      }

      // 创建新映射
      for (const requirementId of selectedRequirements) {
        await supabaseDb.createRequirementComponentMapping({
          requirementId,
          componentId: selectedComponent.id,
          relationship: 'implements'
        });
      }

      loadData();
      setShowMappingModal(false);
      setSelectedComponent(null);
      setSelectedRequirements([]);
    } catch (error) {
      console.error('Failed to save mappings:', error);
    }
  };

  // 切换需求选择
  const toggleRequirement = (requirementId: string) => {
    setSelectedRequirements(prev => 
      prev.includes(requirementId)
        ? prev.filter(id => id !== requirementId)
        : [...prev, requirementId]
    );
  };

  // 获取组件类型颜色
  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'frontend': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'backend': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'service': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'database': return 'bg-green-100 text-green-800 border-green-200';
      case 'gateway': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="h-full flex">
      {/* 组件列表 */}
      <div className="w-1/2 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">系统组件</h2>
          <p className="text-sm text-gray-600 mt-1">管理系统架构组件和需求映射</p>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
          {components.map(component => {
            const componentRequirements = getComponentRequirements(component.id);
            return (
              <div
                key={component.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openMappingModal(component)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{component.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs border ${getComponentTypeColor(component.type)}`}>
                    {component.type}
                  </span>
                </div>
                
                {component.description && (
                  <p className="text-sm text-gray-600 mb-3">{component.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    关联需求: {componentRequirements.length}
                  </span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    管理映射
                  </button>
                </div>
                
                {componentRequirements.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {componentRequirements.slice(0, 3).map(req => (
                      <span
                        key={req.id}
                        className={`px-2 py-1 rounded text-xs ${getPriorityColor(req.priority)}`}
                      >
                        {req.title.length > 20 ? req.title.substring(0, 20) + '...' : req.title}
                      </span>
                    ))}
                    {componentRequirements.length > 3 && (
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        +{componentRequirements.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {components.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>暂无系统组件</p>
              <p className="text-sm mt-1">请先在架构画布中添加组件</p>
            </div>
          )}
        </div>
      </div>

      {/* 需求列表 */}
      <div className="w-1/2 bg-gray-50">
        <div className="p-4 border-b bg-white">
          <h2 className="text-lg font-semibold">项目需求</h2>
          <p className="text-sm text-gray-600 mt-1">查看需求与组件的映射关系</p>
        </div>
        
        <div className="p-4 space-y-4 overflow-y-auto" style={{ height: 'calc(100% - 80px)' }}>
          {requirements.map(requirement => {
            const requirementComponents = getRequirementComponents(requirement.id);
            return (
              <div key={requirement.id} className="bg-white border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium">{requirement.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(requirement.priority)}`}>
                    {requirement.priority}
                  </span>
                </div>
                
                {requirement.description && (
                  <p className="text-sm text-gray-600 mb-3">{requirement.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    实现组件: {requirementComponents.length}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    requirement.status === 'completed' ? 'bg-green-100 text-green-800' :
                    requirement.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    requirement.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {requirement.status}
                  </span>
                </div>
                
                {requirementComponents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {requirementComponents.map(comp => (
                      <span
                        key={comp.id}
                        className={`px-2 py-1 rounded text-xs border ${getComponentTypeColor(comp.type)}`}
                      >
                        {comp.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          
          {requirements.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>暂无项目需求</p>
              <p className="text-sm mt-1">请先在需求管理中添加需求</p>
            </div>
          )}
        </div>
      </div>

      {/* 映射管理模态框 */}
      {showMappingModal && selectedComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-2/3 max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">管理组件需求映射</h3>
              <p className="text-sm text-gray-600 mt-1">
                组件: <span className="font-medium">{selectedComponent.name}</span>
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              <div className="space-y-3">
                {requirements.map(requirement => (
                  <div
                    key={requirement.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedRequirements.includes(requirement.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleRequirement(requirement.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRequirements.includes(requirement.id)}
                            onChange={() => toggleRequirement(requirement.id)}
                            className="rounded"
                          />
                          <h4 className="font-medium">{requirement.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(requirement.priority)}`}>
                            {requirement.priority}
                          </span>
                        </div>
                        {requirement.description && (
                          <p className="text-sm text-gray-600 mt-1 ml-6">{requirement.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowMappingModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={saveMappings}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                保存映射
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}