# ARQUITECTURA DEL PROYECTO PAKU VET

## 📋 Tabla de Contenidos
- [Visión General](#visión-general)
- [Decisiones Técnicas](#decisiones-técnicas)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Gestión de Estado](#gestión-de-estado)
- [Navegación](#navegación)
- [Patrones de Diseño](#patrones-de-diseño)

## 🎯 Visión General

PAKU es una aplicación móvil multiplataforma para gestión veterinaria con tres tipos de usuarios (Admin, Groomer, User), cada uno con interfaces y funcionalidades específicas.

### Stack Tecnológico

- **Frontend Framework**: React Native 0.76.5
- **Build Tool**: Expo SDK 52
- **Lenguaje**: TypeScript 5.3.3
- **Navegación**: Expo Router 4.x (file-based)
- **Estado Global**: Zustand 4.5.0
- **HTTP Client**: Axios 1.6.7
- **Formularios**: React Hook Form 7.50.1
- **Validación**: Zod 3.22.4
- **Persistencia**: AsyncStorage 1.23.1

## 🔧 Decisiones Técnicas

### ¿Por qué Expo Router?

1. **File-based routing**: Estructura clara y predecible
2. **Navegación tipada**: TypeScript integrado
3. **Deep linking**: Soporte nativo
4. **Layouts anidados**: Perfecto para múltiples roles
5. **Estándar de Expo**: Mejor soporte a futuro

### ¿Por qué Zustand?

1. **Simplicidad**: API minimalista
2. **Sin boilerplate**: Menos código que Redux
3. **TypeScript**: Excelente soporte
4. **Rendimiento**: Re-renders optimizados
5. **DevTools**: Fácil debugging

### ¿Por qué React Hook Form + Zod?

1. **Rendimiento**: Menos re-renders
2. **Validación tipada**: Type-safe schemas
3. **DX**: Excelente developer experience
4. **Pequeño bundle**: ~8kb
5. **Flexibilidad**: Fácil personalización

## 🔐 Flujo de Autenticación

### Diagrama de Flujo

```
Usuario → Login/Register
    ↓
API Authentication
    ↓
Recibe: { user, tokens: { accessToken, refreshToken } }
    ↓
Guarda en AsyncStorage
    ↓
Actualiza Zustand Store
    ↓
Redirect según rol:
    - admin → /(tabs)/(admin)
    - groomer → /(tabs)/(groomer)
    - user → /(tabs)/(user)
```

### Refresh Token

El sistema implementa refresh automático:

1. **Interceptor de Request**: Agrega token a cada petición
2. **Interceptor de Response**: Detecta 401
3. **Refresh Automático**: Solicita nuevo token
4. **Retry**: Reintenta petición original
5. **Logout**: Si refresh falla, cierra sesión

```typescript
// src/api/client.ts
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Lógica de refresh token
    }
  }
);
```

### Hook useTokenRefresh

Verifica y refresca tokens cada 4 minutos:

```typescript
// Ejecuta en background
setInterval(() => {
  if (isTokenExpiringSoon()) {
    refreshToken();
  }
}, 240000); // 4 minutos
```

## 📦 Gestión de Estado

### Store de Autenticación

```typescript
interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials) => Promise<void>;
  register: (data) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}
```

### Store de Tema

```typescript
interface ThemeState {
  colorScheme: 'light' | 'dark';
  isLoading: boolean;
  
  setColorScheme: (scheme) => Promise<void>;
  toggleColorScheme: () => Promise<void>;
  loadTheme: () => Promise<void>;
}
```

### ¿Cuándo crear un nuevo Store?

Crea un store cuando:
- El estado es compartido entre múltiples componentes
- El estado persiste entre navegaciones
- Necesitas acceso global a los datos

NO uses store para:
- Estado local de UI
- Formularios (usa React Hook Form)
- Estado derivado (usa useMemo)

## 🧭 Navegación

### Estructura de Rutas

```
app/
├── index.tsx                    # Punto de entrada
├── _layout.tsx                  # Layout raíz
├── (auth)/                      # Grupo de autenticación
│   ├── _layout.tsx
│   ├── login.tsx
│   └── register.tsx
└── (tabs)/                      # Grupo protegido
    ├── _layout.tsx              # Redirige según rol
    ├── (admin)/
    │   ├── _layout.tsx          # Tabs de admin
    │   ├── index.tsx
    │   ├── groomers.tsx
    │   └── clients.tsx
    ├── (groomer)/
    │   ├── _layout.tsx
    │   ├── index.tsx
    │   └── appointments.tsx
    └── (user)/
        ├── _layout.tsx
        ├── index.tsx
        ├── pets.tsx
        └── appointments.tsx
```

### Protección de Rutas

```typescript
// app/(tabs)/_layout.tsx
export default function TabsLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Redirige según rol
  switch (user.role) {
    case 'admin': return <Redirect href="/(tabs)/(admin)" />;
    case 'groomer': return <Redirect href="/(tabs)/(groomer)" />;
    case 'user': return <Redirect href="/(tabs)/(user)" />;
  }
}
```

## 🎨 Patrones de Diseño

### Atomic Design (Componentes)

```
components/
├── common/              # Atoms (Button, Input, etc.)
├── layout/              # Templates (Screen, etc.)
└── [feature]/           # Organisms (específicos)
```

### Custom Hooks

Encapsulan lógica reutilizable:

```typescript
// src/hooks/useAuth.ts
export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    login: async (creds) => await store.login(creds),
    // ...más métodos wrapper
  };
};
```

### Service Layer

Separa la lógica de API de los componentes:

```typescript
// src/api/services/auth.service.ts
export const authService = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  // ...
};
```

## 📐 Convenciones de Código

### Nomenclatura

- **Componentes**: PascalCase (`Button.tsx`)
- **Hooks**: camelCase con 'use' (`useAuth.ts`)
- **Servicios**: camelCase con 'Service' (`authService`)
- **Tipos**: PascalCase (`User`, `AuthResponse`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)

### Imports

Usa path aliases configurados en `tsconfig.json`:

```typescript
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
```

### TypeScript

- Siempre tipamos todo
- Evitamos `any`
- Usamos tipos inferidos cuando sea posible
- Definimos interfaces para props de componentes

## 🔄 Flujo de Datos

```
Usuario Interactúa
    ↓
Componente (React Hook Form)
    ↓
Validación (Zod Schema)
    ↓
Submit Handler
    ↓
Custom Hook (useAuth, etc.)
    ↓
Zustand Store
    ↓
API Service
    ↓
Axios Client (con interceptores)
    ↓
API Backend
    ↓
Response
    ↓
Store actualiza estado
    ↓
Componente re-renderiza
```

## 🚀 Performance

### Optimizaciones Implementadas

1. **useMemo**: Para colores del tema
2. **Zustand Selectors**: Re-renders selectivos
3. **React Hook Form**: Sin re-renders en cada keystroke
4. **Lazy Loading**: Componentes cargados bajo demanda (futuro)
5. **Image Optimization**: Usar expo-image (futuro)

## 🧪 Testing (A Implementar)

### Estrategia Recomendada

```
tests/
├── unit/               # Lógica de negocio
├── integration/        # Flujos completos
└── e2e/               # Tests end-to-end
```

## 📱 Responsividad

- Usar dimensiones relativas (`flex`, porcentajes)
- Spacing constants de `src/constants/theme.ts`
- Media queries cuando sea necesario (web)

## 🔒 Seguridad

- Tokens en AsyncStorage (encriptado en producción)
- HTTPS only en producción
- Validación en cliente Y servidor
- Sanitización de inputs
- Rate limiting en API

## 📈 Escalabilidad

El proyecto está preparado para:
- Agregar nuevos roles fácilmente
- Módulos independientes
- Testing incremental
- Internacionalización (i18n)
- Múltiples temas
- Features flags

## 🎯 Mejores Prácticas

1. **Un componente = Una responsabilidad**
2. **Hooks para lógica reutilizable**
3. **Stores para estado global mínimo**
4. **Validación con schemas tipados**
5. **Error boundaries (a implementar)**
6. **Logging estructurado**
7. **Comments para lógica compleja**
8. **README actualizado**

## 📚 Recursos

- [Expo Docs](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)
