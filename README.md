# 📊 Mood Tracking App

Una aplicación moderna de seguimiento de estado de ánimo construida con Next.js 15 y Supabase, diseñada para ayudar a los usuarios a registrar y analizar sus estados emocionales diarios.

## ✨ Características

- **🎭 Registro de Estados de Ánimo**: Feliz, Neutral, Triste
- **📝 Notas Opcionales**: Añade contexto a cada entrada
- **📈 Historial Visual**: Revisa los últimos 7 días
- **👥 Sistema de Usuarios**: Múltiples usuarios predefinidos
- **🔒 Seguridad**: Row Level Security (RLS) con Supabase
- **📱 Diseño Responsivo**: Optimizado para móviles y escritorio
- **🎨 UI Moderna**: Componentes shadcn/ui con Tailwind CSS

## 🛠️ Tecnologías

- **Frontend**: Next.js 15, React 19, TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **UI**: shadcn/ui, Tailwind CSS, Lucide React
- **Formularios**: React Hook Form + Zod
- **Notificaciones**: Sonner Toast

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm
- Cuenta de Supabase

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/mood-tracking-app.git
cd mood-tracking-app
```

### 2. Instalar dependencias

```bash
npm install --legacy-peer-deps
```

### 3. Configurar variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

### 4. Configurar la base de datos

Ejecuta el script SQL en tu proyecto Supabase:

```sql
-- Ver archivo: create-tables.sql
```

### 5. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Estructura de la Base de Datos

### Tabla `users`
- `id` (UUID, Primary Key)
- `username` (VARCHAR, Unique)
- `display_name` (VARCHAR)
- `emoji` (VARCHAR)
- `created_at`, `updated_at` (Timestamps)

### Tabla `mood_entries`
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `mood_type` (ENUM: 'happy', 'neutral', 'sad')
- `note` (TEXT, Optional)
- `entry_date` (DATE, Unique per user)
- `created_at`, `updated_at` (Timestamps)

## 🎯 Funcionalidades

### Para Usuarios
1. **Login Simple**: Selecciona tu usuario predefinido
2. **Registro Diario**: Un estado de ánimo por día
3. **Notas Contextuales**: Añade detalles sobre tu día
4. **Historial Visual**: Revisa tus últimos 7 días
5. **Persistencia**: Datos guardados en Supabase

### Para Desarrolladores
- **Tipos TypeScript**: Interfaces bien definidas
- **Componentes Reutilizables**: Arquitectura modular
- **Manejo de Errores**: Toast notifications
- **Optimización**: Índices de base de datos
- **Seguridad**: RLS policies configuradas

## 📁 Estructura del Proyecto

```
mood-tracking-app/
├── app/                    # Next.js App Router
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/             # Componentes React
│   ├── ui/                # shadcn/ui components
│   ├── login-screen.tsx
│   ├── mood-form.tsx
│   ├── mood-history.tsx
│   └── theme-provider.tsx
├── lib/                   # Utilidades y configuración
│   ├── supabase.ts        # Cliente Supabase
│   ├── types.ts          # Tipos TypeScript
│   └── utils.ts
├── hooks/                 # Custom hooks
├── public/               # Assets estáticos
├── styles/               # Estilos globales
├── create-tables.sql     # Script de base de datos
└── supabase-schema.sql   # Schema completo
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Servidor de producción
npm run lint         # Linting con ESLint
```

## 🚀 Despliegue

### Vercel (Recomendado)

1. Conecta tu repositorio a Vercel
2. Añade las variables de entorno
3. Deploy automático

### Otras plataformas

La aplicación es compatible con cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- [Next.js](https://nextjs.org/) - Framework React
- [Supabase](https://supabase.com/) - Backend as a Service
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Lucide](https://lucide.dev/) - Iconos

---

**Desarrollado con ❤️ para ayudar a las personas a entender mejor sus emociones.**
# Deploy trigger Mon Oct  6 17:47:29 CST 2025
