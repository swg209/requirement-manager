// 数据库模型定义
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  category: string;
  assignee?: string;
  estimatedHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Component {
  id: string;
  projectId: string;
  name: string;
  type: 'frontend' | 'backend' | 'database' | 'service' | 'gateway';
  description: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequirementComponentMapping {
  id: string;
  requirementId: string;
  componentId: string;
  relationship: 'implements' | 'depends_on' | 'affects';
  createdAt: Date;
}

export interface ComponentConnection {
  id: string;
  projectId: string;
  sourceComponentId: string;
  targetComponentId: string;
  connectionType: 'data_flow' | 'api_call' | 'dependency';
  label?: string;
  createdAt: Date;
}

// 内存数据存储（生产环境应使用真实数据库）
export class InMemoryDatabase {
  private projects: Project[] = [];
  private requirements: Requirement[] = [];
  private components: Component[] = [];
  private requirementComponentMappings: RequirementComponentMapping[] = [];
  private componentConnections: ComponentConnection[] = [];

  // 项目相关方法
  createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Project {
    const newProject: Project = {
      ...project,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.push(newProject);
    return newProject;
  }

  getProjects(): Project[] {
    return this.projects;
  }

  getProject(id: string): Project | undefined {
    return this.projects.find(p => p.id === id);
  }

  // 需求相关方法
  createRequirement(requirement: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>): Requirement {
    const newRequirement: Requirement = {
      ...requirement,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.requirements.push(newRequirement);
    return newRequirement;
  }

  getRequirements(projectId?: string): Requirement[] {
    if (projectId) {
      return this.requirements.filter(r => r.projectId === projectId);
    }
    return this.requirements;
  }

  updateRequirement(id: string, updates: Partial<Requirement>): Requirement | undefined {
    const index = this.requirements.findIndex(r => r.id === id);
    if (index !== -1) {
      this.requirements[index] = {
        ...this.requirements[index],
        ...updates,
        updatedAt: new Date(),
      };
      return this.requirements[index];
    }
    return undefined;
  }

  deleteRequirement(id: string): boolean {
    const index = this.requirements.findIndex(r => r.id === id);
    if (index !== -1) {
      this.requirements.splice(index, 1);
      // 删除相关的映射关系
      this.requirementComponentMappings = this.requirementComponentMappings.filter(
        m => m.requirementId !== id
      );
      return true;
    }
    return false;
  }

  // 组件相关方法
  createComponent(component: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>): Component {
    const newComponent: Component = {
      ...component,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.components.push(newComponent);
    return newComponent;
  }

  getComponents(projectId?: string): Component[] {
    if (projectId) {
      return this.components.filter(c => c.projectId === projectId);
    }
    return this.components;
  }

  updateComponent(id: string, updates: Partial<Component>): Component | undefined {
    const index = this.components.findIndex(c => c.id === id);
    if (index !== -1) {
      this.components[index] = {
        ...this.components[index],
        ...updates,
        updatedAt: new Date(),
      };
      return this.components[index];
    }
    return undefined;
  }

  deleteComponent(id: string): boolean {
    const index = this.components.findIndex(c => c.id === id);
    if (index !== -1) {
      this.components.splice(index, 1);
      // 删除相关的映射关系和连接
      this.requirementComponentMappings = this.requirementComponentMappings.filter(
        m => m.componentId !== id
      );
      this.componentConnections = this.componentConnections.filter(
        c => c.sourceComponentId !== id && c.targetComponentId !== id
      );
      return true;
    }
    return false;
  }

  // 需求-组件映射方法
  createRequirementComponentMapping(
    mapping: Omit<RequirementComponentMapping, 'id' | 'createdAt'>
  ): RequirementComponentMapping {
    const newMapping: RequirementComponentMapping = {
      ...mapping,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.requirementComponentMappings.push(newMapping);
    return newMapping;
  }

  getRequirementComponentMappings(requirementId?: string, componentId?: string): RequirementComponentMapping[] {
    let mappings = this.requirementComponentMappings;
    if (requirementId) {
      mappings = mappings.filter(m => m.requirementId === requirementId);
    }
    if (componentId) {
      mappings = mappings.filter(m => m.componentId === componentId);
    }
    return mappings;
  }

  // 组件连接方法
  createComponentConnection(
    connection: Omit<ComponentConnection, 'id' | 'createdAt'>
  ): ComponentConnection {
    const newConnection: ComponentConnection = {
      ...connection,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.componentConnections.push(newConnection);
    return newConnection;
  }

  getComponentConnections(projectId?: string): ComponentConnection[] {
    if (projectId) {
      return this.componentConnections.filter(c => c.projectId === projectId);
    }
    return this.componentConnections;
  }

  // 搜索方法
  searchRequirements(projectId: string, query: string): Requirement[] {
    const projectRequirements = this.getRequirements(projectId);
    if (!query.trim()) {
      return projectRequirements;
    }
    
    const lowerQuery = query.toLowerCase();
    return projectRequirements.filter(req => 
      req.title.toLowerCase().includes(lowerQuery) ||
      req.description.toLowerCase().includes(lowerQuery) ||
      req.category.toLowerCase().includes(lowerQuery)
    );
  }

  // 批量导入需求
  batchCreateRequirements(requirements: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>[]): Requirement[] {
    return requirements.map(req => this.createRequirement(req));
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

// 全局数据库实例
export const db = new InMemoryDatabase();