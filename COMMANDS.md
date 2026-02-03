# COMANDOS ÚTILES - PAKU VET

## Instalación Inicial

```bash
# Clonar el repositorio (cuando esté en GitHub)
git clone <repo-url>
cd paku-vet

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar .env con tu URL de API
nano .env  # o usar tu editor preferido
```

## Desarrollo

```bash
# Iniciar el proyecto
npm start

# Iniciar en Android
npm run android

# Iniciar en iOS
npm run ios

# Iniciar en Web
npm run web

# Limpiar caché y reiniciar
npm run reset
```

## Estructura de Archivos a Crear

Cuando necesites agregar nuevas funcionalidades:

### Nuevo Servicio API
```bash
# Crear en: src/api/services/
# Ejemplo: src/api/services/pets.service.ts
```

### Nuevo Store de Zustand
```bash
# Crear en: src/store/
# Ejemplo: src/store/petsStore.ts
```

### Nuevo Custom Hook
```bash
# Crear en: src/hooks/
# Ejemplo: src/hooks/usePets.ts
```

### Nuevo Componente
```bash
# Componentes comunes: src/components/common/
# Componentes específicos: src/components/[nombre-modulo]/
```

### Nueva Pantalla
```bash
# Usar Expo Router file-based routing
# Admin: app/(tabs)/(admin)/nueva-pantalla.tsx
# Groomer: app/(tabs)/(groomer)/nueva-pantalla.tsx
# User: app/(tabs)/(user)/nueva-pantalla.tsx
```

## Testing (cuando se implemente)

```bash
# Ejecutar tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage
npm run test:coverage
```

## Build para Producción

```bash
# Android
eas build --platform android

# iOS
eas build --platform ios

# Ambos
eas build --platform all
```

## Troubleshooting

### Limpiar todo y reinstalar
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run reset
```

### Error de Metro bundler
```bash
npx expo start -c
```

### Error de watchman (Mac)
```bash
brew install watchman
```

### Problemas con TypeScript
```bash
npx tsc --noEmit
```

## Variables de Entorno

Archivo: `.env`

```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Nota:** Todas las variables de entorno que quieras usar en el código deben empezar con `EXPO_PUBLIC_`

## Consejos de Desarrollo

1. **Usa Hot Reload**: Los cambios se reflejan automáticamente
2. **Revisa la consola**: `npm start` muestra logs útiles
3. **Usa TypeScript**: Aprovecha el autocompletado y detección de errores
4. **Sigue la estructura**: Mantén el código organizado según la estructura establecida
5. **Componentes reutilizables**: Usa los componentes de src/components/common/

## Integración con API

Asegúrate de que tu API tenga los siguientes endpoints:

- POST `/auth/login` - Autenticación
- POST `/auth/register` - Registro
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - Cerrar sesión
- GET `/auth/me` - Usuario actual

## Próximos Pasos Recomendados

1. Configurar tu archivo `.env` con la URL correcta de tu API
2. Probar el login con credenciales de tu backend
3. Verificar que el refresh token funcione correctamente
4. Empezar a integrar las vistas según el diseño de Figma
