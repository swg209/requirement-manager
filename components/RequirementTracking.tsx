'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Requirement, Component, RequirementComponentMapping } from '../lib/database';
import { supabaseDb } from '@/lib/supabase-database';

interface RequirementTrackingProps {
  projectId: string;
}

interface RequirementProgress {
  requirement: Requirement;
  components: Component[];
  completionRate: number;
  blockers: string[];
}

export default function RequirementTracking({ projectId }: RequirementTrackingProps) {
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [mappings, setMappings] = useState<RequirementComponentMapping[]>([]);
  const [progressData, setProgressData] = useState<RequirementProgress[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  // 加载数据
  useEffect(() => {
    loadData();
  }, [projectId]);

  // 计算进度数据
  useEffect(() => {
    calculateProgress();
  }, [requirements, components, mappings]);

  const loadData = async () => {
    try {
      const allReqs = await supabaseDb.getRequirements();
      const allComps = await supabaseDb.getComponents();
      const allMaps = await supabaseDb.getRequirementComponentMappings();
      
      const reqs = allReqs.filter(req => req.projectId === projectId);
      const comps = allComps.filter(comp => comp.projectId === projectId);
      
      setRequirements(reqs);
      setComponents(comps);
      setMappings(allMaps);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const calculateProgress = () => {
    const progress = requirements.map(req => {
      const reqMappings = mappings.filter(m => m.requirementId === req.id);
      const reqComponents = components.filter(comp => 
        reqMappings.some(mapping => mapping.componentId === comp.id)
      );

      // 计算完成率（基于需求状态和组件数量）
      let completionRate = 0;
      if (req.status === 'completed') {
        completionRate = 100;
      } else if (req.status === 'in_progress') {
        completionRate = reqComponents.length > 0 ? 60 : 30;
      } else if (req.status === 'blocked') {
        completionRate = 10;
      } else {
        completionRate = reqComponents.length > 0 ? 20 : 0;
      }

      // 识别阻塞因素
      const blockers: string[] = [];
      if (req.status === 'blocked') {
        blockers.push('需求被阻塞');
      }
      if (reqComponents.length === 0) {
        blockers.push('未分配实现组件');
      }
      if (req.priority === 'high' && req.status === 'pending') {
        blockers.push('高优先级需求未开始');
      }

      return {
        requirement: req,
        components: reqComponents,
        completionRate,
        blockers
      };
    });

    setProgressData(progress);
  };

  // 过滤需求
  const filteredProgress = progressData.filter(item => {
    const statusMatch = selectedStatus === 'all' || item.requirement.status === selectedStatus;
    const priorityMatch = selectedPriority === 'all' || item.requirement.priority === selectedPriority;
    return statusMatch && priorityMatch;
  });

  // 获取项目统计
  const getProjectStats = () => {
    const total = requirements.length;
    const completed = requirements.filter(r => r.status === 'completed').length;
    const inProgress = requirements.filter(r => r.status === 'in_progress').length;
    const blocked = requirements.filter(r => r.status === 'blocked').length;
    const pending = requirements.filter(r => r.status === 'pending').length;

    const overallProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, blocked, pending, overallProgress };
  };

  const stats = getProjectStats();

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  // 获取优先级颜色
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 统计面板 */}
      <div className="bg-white border-b p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">需求追踪概览</h2>
          <div className="text-sm text-gray-600">
            项目进度: {stats.overallProgress}%
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span>整体进度</span>
            <span>{stats.completed}/{stats.total} 已完成</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${stats.overallProgress}%` }}
            />
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-green-600">已完成</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-blue-600">进行中</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-sm text-red-600">已阻塞</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">待开始</div>
          </div>
        </div>
      </div>

      {/* 过滤器 */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">状态筛选</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">全部状态</option>
              <option value="pending">待开始</option>
              <option value="in_progress">进行中</option>
              <option value="completed">已完成</option>
              <option value="blocked">已阻塞</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">优先级筛选</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="all">全部优先级</option>
              <option value="high">高优先级</option>
              <option value="medium">中优先级</option>
              <option value="low">低优先级</option>
            </select>
          </div>
        </div>
      </div>

      {/* 需求列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredProgress.map(item => (
          <div key={item.requirement.id} className="bg-white border rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">{item.requirement.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(item.requirement.priority)}`}>
                    {item.requirement.priority}
                  </span>
                </div>
                {item.requirement.description && (
                  <p className="text-sm text-gray-600 mb-2">{item.requirement.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${getStatusColor(item.requirement.status)}`} />
                <span className="text-sm text-gray-600">{item.requirement.status}</span>
              </div>
            </div>

            {/* 进度条 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span>完成进度</span>
                <span>{item.completionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.completionRate === 100 ? 'bg-green-500' :
                    item.completionRate >= 60 ? 'bg-blue-500' :
                    item.completionRate >= 30 ? 'bg-yellow-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${item.completionRate}%` }}
                />
              </div>
            </div>

            {/* 实现组件 */}
            {item.components.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium mb-1">实现组件:</div>
                <div className="flex flex-wrap gap-1">
                  {item.components.map(comp => (
                    <span
                      key={comp.id}
                      className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                    >
                      {comp.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 阻塞因素 */}
            {item.blockers.length > 0 && (
              <div className="mb-3">
                <div className="text-sm font-medium mb-1 text-red-600">阻塞因素:</div>
                <div className="space-y-1">
                  {item.blockers.map((blocker, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                      <span className="w-1 h-1 bg-red-500 rounded-full" />
                      {blocker}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 时间信息 */}
            <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
              <span>创建时间: {item.requirement.createdAt.toLocaleDateString()}</span>
              <span>更新时间: {item.requirement.updatedAt.toLocaleDateString()}</span>
            </div>
          </div>
        ))}

        {filteredProgress.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>没有找到匹配的需求</p>
            <p className="text-sm mt-1">尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  );
}