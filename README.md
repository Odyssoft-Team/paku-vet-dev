# PAKU - Veterinaria App

Aplicación móvil para la veterinaria PAKU desarrollada con React Native, Expo y TypeScript.

## 🚀 Tecnologías

- **React Native** - Framework para desarrollo móvil
- **Expo SDK 52** - Herramientas y servicios para React Native
- **Expo Router** - Sistema de navegación file-based
- **TypeScript** - Tipado estático
- **Zustand** - Gestión de estado global
- **Axios** - Cliente HTTP
- **React Hook Form + Zod** - Manejo y validación de formularios
- **AsyncStorage** - Persistencia de datos local

## 📁 Estructura del Proyecto

```
paku-vet/
├── app/                          # Expo Router - rutas de la app
│   ├── (auth)/                  # Autenticación
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (tabs)/                  # Navegación por tabs
│   │   ├── (admin)/            # Vistas del administrador
│   │   ├── (groomer)/          # Vistas del groomer
│   │   └── (user)/             # Vistas del cliente
│   ├── _layout.tsx
│   └── index.tsx
├── src/
│   ├── api/                     # Servicios API
│   │   ├── client.ts           # Cliente Axios configurado
│   │   ├── endpoints.ts        # Definición de endpoints
│   │   └── services/           # Servicios por módulo
│   ├── components/              # Componentes reutilizables
│   │   ├── common/             # Componentes comunes (Button, Input, etc.)
│   │   └── layout/             # Componentes de layout
│   ├── constants/               # Constantes (colores, tema, config)
│   ├── hooks/                   # Custom hooks
│   ├── store/                   # Zustand stores
│   ├── types/                   # Tipos TypeScript
│   └── utils/                   # Utilidades y helpers
├── assets/                      # Recursos estáticos
└── package.json
```

## 🛠️ Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita el archivo `.env` con la URL de tu API:

```
EXPO_PUBLIC_API_URL=http://tu-api-url.com/api
```

### 3. Iniciar el proyecto

```bash
npm start
```

Opciones:
- `npm run android` - Abrir en Android
- `npm run ios` - Abrir en iOS
- `npm run web` - Abrir en web

## 👥 Roles de Usuario

La aplicación maneja 3 tipos de usuarios:

1. **Admin** - Administrador de la veterinaria
2. **Groomer** - Especialista/Veterinario
3. **User** - Cliente

Cada rol tiene vistas y permisos diferentes.

## 🔐 Autenticación

El sistema de autenticación incluye:

- Login con email y contraseña
- Registro de nuevos usuarios
- Refresh token automático
- Persistencia de sesión con AsyncStorage
- Interceptores de Axios para manejo de tokens

## 🎨 Temas

La aplicación soporta modo claro y oscuro:

- Los colores se definen en `src/constants/colors.ts`
- El estado del tema se maneja con Zustand
- Se persiste la preferencia del usuario

## 📱 Navegación

Se utiliza **Expo Router** con navegación file-based:

- `(auth)` - Rutas de autenticación (login, register)
- `(tabs)` - Rutas protegidas con navegación por tabs
- Redirección automática según estado de autenticación y rol

## 🔧 Componentes Principales

### Screen
Wrapper para pantallas con soporte para:
- SafeArea
- KeyboardAvoidingView
- ScrollView opcional
- Estilos consistentes

### Button
Botón personalizable con:
- Variantes: primary, secondary, outline, ghost
- Tamaños: sm, md, lg
- Estado de carga
- Disabled state

### Input
Campo de texto con:
- Label y error
- Íconos izquierdo/derecho
- Tipos: text, password, email, phone
- Toggle de visibilidad para contraseñas

## 📝 Formularios

Se utiliza **React Hook Form** con **Zod** para validación:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/utils/validators';

const { control, handleSubmit } = useForm({
  resolver: zodResolver(loginSchema),
});
```

## 🌐 API

### Cliente Axios

El cliente está configurado en `src/api/client.ts` con:

- Base URL desde variables de entorno
- Timeout de 30 segundos
- Interceptores para agregar token automáticamente
- Manejo automático de refresh token en errores 401

### Servicios

Los servicios están organizados por módulo:

- `authService` - Login, registro, refresh token
- `userService` - Perfil, actualización de datos

## 🎯 Próximos Pasos

1. ✅ Estructura base creada
2. ✅ Sistema de autenticación implementado
3. ✅ Navegación por roles configurada
4. ⏳ Integrar diseños de Figma
5. ⏳ Desarrollar pantallas específicas por rol
6. ⏳ Implementar funcionalidades de cada módulo

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

## 👨‍💻 Desarrollo

Para contribuir al proyecto:

1. Mantén la estructura de carpetas establecida
2. Sigue las convenciones de TypeScript
3. Usa los componentes reutilizables
4. Implementa manejo de errores
5. Documenta funciones complejas
