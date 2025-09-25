'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { supabaseDb } from '@/lib/supabase-database';
import { Component, ComponentConnection } from '@/lib/database';

interface CanvasComponent extends Component {
}

interface CanvasConnection extends ComponentConnection {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface ArchitectureCanvasProps {
  projectId: string;
}

export default function ArchitectureCanvas({ projectId }: ArchitectureCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [components, setComponents] = useState<CanvasComponent[]>([]);
  const [connections, setConnections] = useState<CanvasConnection[]>([]);
  const [draggedComponent, setDraggedComponent] = useState<CanvasComponent | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<CanvasComponent | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: '',
    type: 'service' as const,
    description: ''
  });

  // 加载组件和连接数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const allComponents = await supabaseDb.getComponents();
        const allConnections = await supabaseDb.getComponentConnections();
        
        const projectComponents = allComponents.filter(comp => comp.projectId === projectId);
        const projectConnections = allConnections.filter(conn => {
          // 检查连接的两个组件是否都属于当前项目
          const fromComp = projectComponents.find(c => c.id === conn.sourceComponentId);
          const toComp = projectComponents.find(c => c.id === conn.targetComponentId);
          return fromComp && toComp;
        });
        
        setComponents(projectComponents);
        setConnections(projectConnections.map((conn: ComponentConnection) => ({
          ...conn,
          startX: 0,
          startY: 0,
          endX: 0,
          endY: 0
        })));
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [projectId]);

  const addComponent = async () => {
    if (!newComponent.name.trim()) return;

    try {
      const component = await supabaseDb.createComponent({
        ...newComponent,
        projectId,
        name: newComponent.name.trim(),
        description: newComponent.description.trim(),
        x: 100,
        y: 100,
        width: 120,
        height: 80,
        color: '#3B82F6'
      });

      setComponents(prev => [...prev, component]);
      setNewComponent({ name: '', type: 'service', description: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create component:', error);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, component: CanvasComponent) => {
    if (isConnecting) {
      if (!connectionStart) {
        setConnectionStart(component);
      } else if (connectionStart.id !== component.id) {
        completeConnection(component);
      }
      return;
    }

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedComponent(component);
    setDragOffset({
      x: e.clientX - rect.left - component.x,
      y: e.clientY - rect.top - component.y
    });
  }, [isConnecting, connectionStart]);

  const handleMouseMove = useCallback(async (e: React.MouseEvent) => {
    if (!draggedComponent || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    if (draggedComponent) {
      try {
        await supabaseDb.updateComponent(draggedComponent.id, {
          x: newX,
          y: newY
        });
        
        setComponents(prev => prev.map(comp => 
          comp.id === draggedComponent.id 
            ? { ...comp, x: newX, y: newY }
            : comp
        ));
      } catch (error) {
        console.error('Failed to update component position:', error);
      }
    }
  }, [draggedComponent, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggedComponent(null);
  }, []);

  const completeConnection = async (targetComponent: CanvasComponent) => {
    if (!connectionStart) return;

    try {
      const connection = await supabaseDb.createComponentConnection({
        projectId,
        sourceComponentId: connectionStart.id,
        targetComponentId: targetComponent.id,
        connectionType: 'dependency',
        label: `Connection from ${connectionStart.name} to ${targetComponent.name}`
      });

      setConnections(prev => [...prev, {
        ...connection,
        startX: 0,
        startY: 0,
        endX: 0,
        endY: 0
      }]);
      
      setConnectionStart(null);
      setIsConnecting(false);
    } catch (error) {
      console.error('Failed to create connection:', error);
    }
  };

  const deleteComponent = async (componentId: string) => {
    if (window.confirm('确定要删除这个组件吗？')) {
      try {
        await supabaseDb.deleteComponent(componentId);
        setComponents(prev => prev.filter(comp => comp.id !== componentId));
        setConnections(prev => prev.filter(conn => 
          conn.sourceComponentId !== componentId && conn.targetComponentId !== componentId
        ));
      } catch (error) {
        console.error('Failed to delete component:', error);
      }
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'frontend': return '#10B981';
      case 'backend': return '#3B82F6';
      case 'database': return '#F59E0B';
      case 'service': return '#8B5CF6';
      case 'gateway': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          添加组件
        </button>
        
        <button
          onClick={() => setIsConnecting(!isConnecting)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            isConnecting 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          连接模式
        </button>

        {isConnecting && (
          <div className="text-sm text-gray-600">
            {connectionStart ? '选择目标组件' : '选择起始组件'}
          </div>
        )}
      </div>

      {/* 画布 */}
      <div 
        ref={canvasRef}
        className="flex-1 relative bg-gray-50 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* SVG for connections */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {connections.map((connection) => {
            const sourceComp = components.find(c => c.id === connection.sourceComponentId);
            const targetComp = components.find(c => c.id === connection.targetComponentId);
            
            if (!sourceComp || !targetComp) return null;
            
            const startX = sourceComp.x + sourceComp.width / 2;
            const startY = sourceComp.y + sourceComp.height / 2;
            const endX = targetComp.x + targetComp.width / 2;
            const endY = targetComp.y + targetComp.height / 2;
            
            return (
              <line
                key={connection.id}
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="#6B7280"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="#6B7280"
              />
            </marker>
          </defs>
        </svg>

        {/* Components */}
        {components.map((component) => (
          <div
            key={component.id}
            className={`absolute border-2 rounded-lg p-3 cursor-move select-none ${
              isConnecting ? 'hover:ring-2 hover:ring-blue-400' : ''
            } ${connectionStart?.id === component.id ? 'ring-2 ring-green-400' : ''}`}
            style={{
              left: component.x,
              top: component.y,
              width: component.width,
              height: component.height,
              backgroundColor: component.color,
              borderColor: component.color,
              color: 'white'
            }}
            onMouseDown={(e) => handleMouseDown(e, component)}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="font-medium text-sm truncate">{component.name}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteComponent(component.id);
                }}
                className="text-white hover:text-red-200 opacity-70 hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="text-xs opacity-80 mb-1">{component.type}</div>
            {component.description && (
              <div className="text-xs opacity-70 truncate">{component.description}</div>
            )}
          </div>
        ))}
      </div>

      {/* 添加组件表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">添加新组件</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">组件名称</label>
                <input
                  type="text"
                  value={newComponent.name}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入组件名称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">组件类型</label>
                <select
                  value={newComponent.type}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="frontend">前端</option>
                  <option value="backend">后端</option>
                  <option value="database">数据库</option>
                  <option value="service">服务</option>
                  <option value="gateway">网关</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <textarea
                  value={newComponent.description}
                  onChange={(e) => setNewComponent(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="输入组件描述"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={addComponent}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                添加
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewComponent({ name: '', type: 'service', description: '' });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}