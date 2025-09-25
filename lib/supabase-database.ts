import { createClient } from '@/utils/supabase/client'
import type { 
  Project, 
  Requirement, 
  Component, 
  RequirementComponentMapping, 
  ComponentConnection 
} from './database'

export class SupabaseDatabase {
  private supabase = createClient()

  // Project methods
  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        name: project.name,
        description: project.description
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getProjects(): Promise<Project[]> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await this.supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return data
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await this.supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteProject(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Requirement methods
  async createRequirement(requirement: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>): Promise<Requirement> {
    const { data, error } = await this.supabase
      .from('requirements')
      .insert({
        title: requirement.title,
        description: requirement.description,
        priority: requirement.priority,
        status: requirement.status,
        project_id: requirement.projectId,
        category: requirement.category,
        assignee: requirement.assignee,
        estimated_hours: requirement.estimatedHours
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      projectId: data.project_id,
      estimatedHours: data.estimated_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getRequirements(): Promise<Requirement[]> {
    const { data, error } = await this.supabase
      .from('requirements')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      projectId: item.project_id,
      estimatedHours: item.estimated_hours,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  }

  async getRequirement(id: string): Promise<Requirement | null> {
    const { data, error } = await this.supabase
      .from('requirements')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return {
      ...data,
      projectId: data.project_id,
      estimatedHours: data.estimated_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async updateRequirement(id: string, updates: Partial<Requirement>): Promise<Requirement> {
    const { data, error } = await this.supabase
      .from('requirements')
      .update({
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
        status: updates.status,
        project_id: updates.projectId,
        category: updates.category,
        assignee: updates.assignee,
        estimated_hours: updates.estimatedHours
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      projectId: data.project_id,
      estimatedHours: data.estimated_hours,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async deleteRequirement(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('requirements')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Component methods
  async createComponent(component: Omit<Component, 'id' | 'createdAt' | 'updatedAt'>): Promise<Component> {
    const { data, error } = await this.supabase
      .from('components')
      .insert({
        name: component.name,
        type: component.type,
        description: component.description,
        project_id: component.projectId,
        x: component.x,
        y: component.y,
        width: component.width,
        height: component.height,
        color: component.color
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async getComponents(): Promise<Component[]> {
    const { data, error } = await this.supabase
      .from('components')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      projectId: item.project_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    }))
  }

  async getComponent(id: string): Promise<Component | null> {
    const { data, error } = await this.supabase
      .from('components')
      .select('*')
      .eq('id', id)
      .single()

    if (error) return null
    return {
      ...data,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async updateComponent(id: string, updates: Partial<Component>): Promise<Component> {
    const { data, error } = await this.supabase
      .from('components')
      .update({
        name: updates.name,
        type: updates.type,
        description: updates.description,
        project_id: updates.projectId,
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
        color: updates.color
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      projectId: data.project_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  async deleteComponent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('components')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Requirement Component Mapping methods
  async createRequirementComponentMapping(mapping: Omit<RequirementComponentMapping, 'id' | 'createdAt'>): Promise<RequirementComponentMapping> {
    const { data, error } = await this.supabase
      .from('requirement_component_mappings')
      .insert({
        requirement_id: mapping.requirementId,
        component_id: mapping.componentId,
        relationship: mapping.relationship
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      requirementId: data.requirement_id,
      componentId: data.component_id,
      createdAt: data.created_at
    }
  }

  async getRequirementComponentMappings(): Promise<RequirementComponentMapping[]> {
    const { data, error } = await this.supabase
      .from('requirement_component_mappings')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      requirementId: item.requirement_id,
      componentId: item.component_id,
      createdAt: item.created_at
    }))
  }

  async deleteRequirementComponentMapping(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('requirement_component_mappings')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Component Connection methods
  async createComponentConnection(connection: Omit<ComponentConnection, 'id' | 'createdAt'>): Promise<ComponentConnection> {
    const { data, error } = await this.supabase
      .from('component_connections')
      .insert({
        project_id: connection.projectId,
        source_component_id: connection.sourceComponentId,
        target_component_id: connection.targetComponentId,
        connection_type: connection.connectionType,
        label: connection.label
      })
      .select()
      .single()

    if (error) throw error
    return {
      ...data,
      sourceComponentId: data.source_component_id,
      targetComponentId: data.target_component_id,
      connectionType: data.connection_type,
      createdAt: data.created_at
    }
  }

  async getComponentConnections(): Promise<ComponentConnection[]> {
    const { data, error } = await this.supabase
      .from('component_connections')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(item => ({
      ...item,
      sourceComponentId: item.source_component_id,
      targetComponentId: item.target_component_id,
      connectionType: item.connection_type,
      createdAt: item.created_at
    }))
  }

  async deleteComponentConnection(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('component_connections')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Create and export a singleton instance
export const supabaseDb = new SupabaseDatabase()