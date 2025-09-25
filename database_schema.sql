-- 需求管理系统数据库表结构
-- 适用于 Supabase PostgreSQL

-- 1. 项目表
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 需求表
CREATE TABLE requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority VARCHAR(20) CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status VARCHAR(20) CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')) DEFAULT 'pending',
    category VARCHAR(100),
    assignee VARCHAR(255),
    estimated_hours INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 系统组件表
CREATE TABLE components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('frontend', 'backend', 'database', 'service', 'gateway')) NOT NULL,
    description TEXT,
    x INTEGER DEFAULT 0,
    y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 150,
    height INTEGER DEFAULT 80,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 需求与组件映射表
CREATE TABLE requirement_component_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requirement_id UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    relationship VARCHAR(20) CHECK (relationship IN ('implements', 'depends_on', 'affects')) DEFAULT 'implements',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requirement_id, component_id)
);

-- 5. 组件连接表
CREATE TABLE component_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    source_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    target_component_id UUID NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    connection_type VARCHAR(20) CHECK (connection_type IN ('data_flow', 'api_call', 'dependency')) DEFAULT 'dependency',
    label VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(source_component_id, target_component_id)
);

-- 创建索引以提高查询性能
CREATE INDEX idx_requirements_project_id ON requirements(project_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_priority ON requirements(priority);
CREATE INDEX idx_components_project_id ON components(project_id);
CREATE INDEX idx_components_type ON components(type);
CREATE INDEX idx_requirement_component_mappings_requirement_id ON requirement_component_mappings(requirement_id);
CREATE INDEX idx_requirement_component_mappings_component_id ON requirement_component_mappings(component_id);
CREATE INDEX idx_component_connections_project_id ON component_connections(project_id);
CREATE INDEX idx_component_connections_source ON component_connections(source_component_id);
CREATE INDEX idx_component_connections_target ON component_connections(target_component_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要自动更新 updated_at 的表创建触发器
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requirements_updated_at BEFORE UPDATE ON requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_components_updated_at BEFORE UPDATE ON components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（可选）
INSERT INTO projects (name, description) VALUES 
('示例项目', '这是一个需求管理系统的示例项目');

-- 为 Supabase 启用行级安全策略（RLS）
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE components ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_component_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE component_connections ENABLE ROW LEVEL SECURITY;

-- 创建基本的 RLS 策略（允许所有操作，您可以根据需要调整）
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on requirements" ON requirements FOR ALL USING (true);
CREATE POLICY "Allow all operations on components" ON components FOR ALL USING (true);
CREATE POLICY "Allow all operations on requirement_component_mappings" ON requirement_component_mappings FOR ALL USING (true);
CREATE POLICY "Allow all operations on component_connections" ON component_connections FOR ALL USING (true);