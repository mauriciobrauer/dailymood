-- =====================================================
-- SCRIPT POSTGRESQL COMPLETO PARA SUPABASE
-- Aplicación de Seguimiento de Estado de Ánimo
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABLA DE USUARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABLA DE ESTADOS DE ÁNIMO
-- =====================================================
CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mood_type VARCHAR(20) NOT NULL CHECK (mood_type IN ('happy', 'neutral', 'sad')),
    note TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Evitar múltiples entradas por usuario por día
    UNIQUE(user_id, entry_date)
);

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================

-- Índice para búsquedas por usuario y fecha
CREATE INDEX IF NOT EXISTS idx_mood_entries_user_date 
ON mood_entries(user_id, entry_date DESC);

-- Índice para búsquedas por tipo de estado de ánimo
CREATE INDEX IF NOT EXISTS idx_mood_entries_mood_type 
ON mood_entries(mood_type);

-- Índice para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_mood_entries_date 
ON mood_entries(entry_date DESC);

-- =====================================================
-- FUNCIONES DE ACTUALIZACIÓN AUTOMÁTICA
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mood_entries_updated_at 
    BEFORE UPDATE ON mood_entries 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES (USUARIOS PREDEFINIDOS)
-- =====================================================
INSERT INTO users (username, display_name, emoji) VALUES
    ('ana_garcia', 'Ana García', '👩'),
    ('carlos_lopez', 'Carlos López', '👨'),
    ('maria_rodriguez', 'María Rodríguez', '👩‍🦰'),
    ('juan_martinez', 'Juan Martínez', '👨‍🦱')
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para obtener el historial completo con información del usuario
CREATE OR REPLACE VIEW mood_history_view AS
SELECT 
    me.id,
    me.user_id,
    u.username,
    u.display_name,
    u.emoji,
    me.mood_type,
    CASE 
        WHEN me.mood_type = 'happy' THEN 'Feliz'
        WHEN me.mood_type = 'neutral' THEN 'Neutral'
        WHEN me.mood_type = 'sad' THEN 'Triste'
        ELSE me.mood_type
    END as mood_label,
    me.note,
    me.entry_date,
    me.created_at,
    me.updated_at
FROM mood_entries me
JOIN users u ON me.user_id = u.id
ORDER BY me.entry_date DESC, me.created_at DESC;

-- Vista para estadísticas de estados de ánimo por usuario
CREATE OR REPLACE VIEW mood_stats_view AS
SELECT 
    u.id as user_id,
    u.username,
    u.display_name,
    COUNT(me.id) as total_entries,
    COUNT(CASE WHEN me.mood_type = 'happy' THEN 1 END) as happy_count,
    COUNT(CASE WHEN me.mood_type = 'neutral' THEN 1 END) as neutral_count,
    COUNT(CASE WHEN me.mood_type = 'sad' THEN 1 END) as sad_count,
    ROUND(
        (COUNT(CASE WHEN me.mood_type = 'happy' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(me.id), 0)) * 100, 2
    ) as happy_percentage,
    ROUND(
        (COUNT(CASE WHEN me.mood_type = 'neutral' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(me.id), 0)) * 100, 2
    ) as neutral_percentage,
    ROUND(
        (COUNT(CASE WHEN me.mood_type = 'sad' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(me.id), 0)) * 100, 2
    ) as sad_percentage,
    MAX(me.entry_date) as last_entry_date,
    MIN(me.entry_date) as first_entry_date
FROM users u
LEFT JOIN mood_entries me ON u.id = me.user_id
GROUP BY u.id, u.username, u.display_name;

-- =====================================================
-- FUNCIONES DE UTILIDAD
-- =====================================================

-- Función para obtener el historial de los últimos N días de un usuario
CREATE OR REPLACE FUNCTION get_user_mood_history(
    p_user_id UUID,
    p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
    id UUID,
    mood_type VARCHAR(20),
    mood_label TEXT,
    note TEXT,
    entry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        me.id,
        me.mood_type,
        CASE 
            WHEN me.mood_type = 'happy' THEN 'Feliz'
            WHEN me.mood_type = 'neutral' THEN 'Neutral'
            WHEN me.mood_type = 'sad' THEN 'Triste'
            ELSE me.mood_type
        END as mood_label,
        me.note,
        me.entry_date,
        me.created_at
    FROM mood_entries me
    WHERE me.user_id = p_user_id
    AND me.entry_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    ORDER BY me.entry_date DESC, me.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para insertar o actualizar un estado de ánimo
CREATE OR REPLACE FUNCTION upsert_mood_entry(
    p_user_id UUID,
    p_mood_type VARCHAR(20),
    p_note TEXT DEFAULT NULL,
    p_entry_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID AS $$
DECLARE
    result_id UUID;
BEGIN
    -- Intentar actualizar si ya existe una entrada para ese día
    UPDATE mood_entries 
    SET 
        mood_type = p_mood_type,
        note = p_note,
        updated_at = NOW()
    WHERE user_id = p_user_id 
    AND entry_date = p_entry_date
    RETURNING id INTO result_id;
    
    -- Si no se actualizó nada, insertar nueva entrada
    IF result_id IS NULL THEN
        INSERT INTO mood_entries (user_id, mood_type, note, entry_date)
        VALUES (p_user_id, p_mood_type, p_note, p_entry_date)
        RETURNING id INTO result_id;
    END IF;
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
-- =====================================================

-- Habilitar RLS en las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;

-- Política para usuarios: todos pueden leer todos los usuarios (para el login)
CREATE POLICY "Users are viewable by everyone" ON users
    FOR SELECT USING (true);

-- Política para mood_entries: los usuarios solo pueden ver sus propias entradas
CREATE POLICY "Users can view own mood entries" ON mood_entries
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Política para mood_entries: los usuarios solo pueden insertar sus propias entradas
CREATE POLICY "Users can insert own mood entries" ON mood_entries
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Política para mood_entries: los usuarios solo pueden actualizar sus propias entradas
CREATE POLICY "Users can update own mood entries" ON mood_entries
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Política para mood_entries: los usuarios solo pueden eliminar sus propias entradas
CREATE POLICY "Users can delete own mood entries" ON mood_entries
    FOR DELETE USING (auth.uid()::text = user_id::text);

-- =====================================================
-- CONFIGURACIÓN DE SUPABASE AUTH (OPCIONAL)
-- =====================================================

-- Si quieres usar Supabase Auth en lugar de usuarios predefinidos,
-- descomenta y modifica las siguientes líneas:

/*
-- Función para crear un perfil de usuario automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, username, display_name, emoji)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'emoji', '👤')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
*/

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE users IS 'Tabla de usuarios del sistema de seguimiento de estado de ánimo';
COMMENT ON TABLE mood_entries IS 'Entradas de estados de ánimo de los usuarios';

COMMENT ON COLUMN users.username IS 'Nombre de usuario único para login';
COMMENT ON COLUMN users.display_name IS 'Nombre completo para mostrar en la interfaz';
COMMENT ON COLUMN users.emoji IS 'Emoji representativo del usuario';

COMMENT ON COLUMN mood_entries.mood_type IS 'Tipo de estado de ánimo: happy, neutral, sad';
COMMENT ON COLUMN mood_entries.note IS 'Nota opcional del usuario sobre su estado de ánimo';
COMMENT ON COLUMN mood_entries.entry_date IS 'Fecha del estado de ánimo (permite solo una entrada por día por usuario)';

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================

-- Para verificar que todo se creó correctamente, ejecuta:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- SELECT * FROM mood_history_view LIMIT 5;
-- SELECT * FROM mood_stats_view;
