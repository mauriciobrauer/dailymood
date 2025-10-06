-- Crear extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de estados de ánimo
CREATE TABLE mood_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('happy', 'neutral', 'sad')),
    note TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

-- Índices
CREATE INDEX idx_mood_entries_user_date ON mood_entries(user_id, entry_date DESC);
CREATE INDEX idx_mood_entries_mood_type ON mood_entries(mood_type);
CREATE INDEX idx_mood_entries_date ON mood_entries(entry_date DESC);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at 
    BEFORE UPDATE ON mood_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertar usuarios predefinidos
INSERT INTO users (username, display_name, emoji) VALUES
    ('ana_garcia', 'Ana García', '👩'),
    ('carlos_lopez', 'Carlos López', '👨'),
    ('maria_rodriguez', 'María Rodríguez', '👩‍🦰'),
    ('juan_martinez', 'Juan Martínez', '👨‍🦱');

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can view own mood entries" ON mood_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own mood entries" ON mood_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own mood entries" ON mood_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete own mood entries" ON mood_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);
