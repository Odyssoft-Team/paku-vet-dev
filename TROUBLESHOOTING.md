# 🔧 SOLUCIÓN DE ERRORES - PAKU VET

## Error: "Cannot use JSX unless the '--jsx' flag is provided"

Este error aparece cuando TypeScript no reconoce correctamente los archivos TSX. Aquí están las soluciones:

### Solución 1: Reinstalar dependencias y limpiar caché

```bash
# Eliminar node_modules y package-lock
rm -rf node_modules package-lock.json

# Reinstalar todo
npm install

# Instalar babel-plugin-module-resolver
npm install --save-dev babel-plugin-module-resolver

# Limpiar caché de Metro
npm start -- --clear

# O usar
npx expo start -c
```

### Solución 2: Reiniciar el servidor TypeScript en VS Code

Si usas VS Code:

1. Abre la Command Palette: `Cmd+Shift+P` (Mac) o `Ctrl+Shift+P` (Windows/Linux)
2. Escribe: "TypeScript: Restart TS Server"
3. Presiona Enter

### Solución 3: Cerrar y reabrir VS Code

A veces VS Code necesita reiniciarse para reconocer los cambios en `tsconfig.json`

```bash
# Cierra VS Code completamente
# Vuelve a abrir el proyecto
code .
```

### Solución 4: Verificar archivos de configuración

Asegúrate de que existan estos archivos en la raíz del proyecto:

#### `tsconfig.json`
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-native",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

#### `babel.config.js`
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
    ],
  };
};
```

### Solución 5: Verificar extensiones de archivos

Asegúrate de que todos los componentes tengan extensión `.tsx` (no `.ts`):

```bash
# Verifica las extensiones
ls -la src/components/common/

# Deberías ver:
# Button.tsx (✓)
# Input.tsx (✓)
# Loading.tsx (✓)
```

## Otros Errores Comunes

### Error: Module not found '@/...'

**Causa**: Los path aliases no están configurados correctamente.

**Solución**:
```bash
# Reinstalar dependencias
npm install

# Limpiar caché
npm start -- --clear

# Reiniciar TypeScript server en VS Code
```

### Error: Expo module not found

**Causa**: Dependencias de Expo no instaladas correctamente.

**Solución**:
```bash
# Instalar dependencias de Expo
npx expo install

# O reinstalar todo
rm -rf node_modules
npm install
```

### Error: Unable to resolve module 'react-native-safe-area-context'

**Causa**: Módulo nativo no está instalado.

**Solución**:
```bash
npx expo install react-native-safe-area-context react-native-screens
```

## 🚀 Proceso de inicio correcto

Para evitar errores, sigue este orden:

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env
cp .env.example .env

# 3. Editar .env con tu API URL
nano .env  # o usa tu editor

# 4. Limpiar caché e iniciar
npm start -- --clear

# O
npx expo start -c
```

## 📱 Verificar que todo funciona

1. El servidor Metro debe iniciar sin errores
2. Deberías ver el QR code en la terminal
3. No debe haber errores de TypeScript en la consola
4. Los archivos `.tsx` deben reconocerse correctamente

## 🆘 Si nada funciona

1. **Elimina todo y vuelve a empezar**:
```bash
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

2. **Verifica versiones**:
```bash
node --version  # Debe ser >= 18
npm --version   # Debe ser >= 9
```

3. **Actualiza Expo CLI**:
```bash
npm install -g expo-cli@latest
```

## 💡 Tips

- Usa `npx expo start -c` para limpiar caché
- Si editas `tsconfig.json` o `babel.config.js`, reinicia el servidor
- VS Code puede tardar unos segundos en reconocer los cambios
- Los errores de TypeScript en el editor no siempre significan que no compilará

## 📞 ¿Sigues con problemas?

Si después de todo esto sigues teniendo errores:

1. Toma un screenshot del error completo
2. Comparte la versión de Node: `node --version`
3. Comparte el sistema operativo que usas
4. Dime qué pasos ya intentaste

¡Te ayudaré a resolverlo! 💪
