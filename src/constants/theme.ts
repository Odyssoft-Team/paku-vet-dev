import { TextStyle, ViewStyle } from "react-native";

// export const Spacing = {
//   xs: 4,
//   sm: 8,
//   md: 16,
//   lg: 24,
//   xl: 32,
//   xxl: 48,
// } as const;

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
} as const;

export const Typography = {
  // Tipos de fuente
  fontFamily: {
    light: "Poppins_300Light",
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semibold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
    extrabold: "Poppins_800ExtraBold",
    black: "Poppins_900Black",
  },
  // Tamaños de fuente
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 36,
  },

  // Pesos de fuente
  fontWeight: {
    regular: "400" as TextStyle["fontWeight"],
    medium: "500" as TextStyle["fontWeight"],
    semibold: "600" as TextStyle["fontWeight"],
    bold: "700" as TextStyle["fontWeight"],
    extrabold: "800" as TextStyle["fontWeight"],
    black: "900" as TextStyle["fontWeight"],
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,

  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,

  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
} as const;

// ===== AGREGAR DESPUÉS DE TU CÓDIGO EXISTENTE =====

// 1. Mejorar el lineHeight (valores absolutos basados en fontSize)
export const LineHeight = {
  xs: 18, // para fontSize 12
  sm: 20, // para fontSize 14
  md: 24, // para fontSize 16
  lg: 26, // para fontSize 18
  xl: 28, // para fontSize 20
  xxl: 32, // para fontSize 24
  xxxl: 40, // para fontSize 32
  xxxxl: 44, // para fontSize 36
} as const;

// 2. Añadir el spacing que faltaba (12px)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12, // ← CAMBIA: antes era 16, ahora es 12
  base: 16, // ← NUEVO: este es tu antiguo md (16px)
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// 3. Crear tokens semánticos (la CLAVE para apps profesionales)
export const Layout = {
  // Paddings estandarizados
  screenPadding: Spacing.base, // 16px - para el contenedor principal
  cardPadding: Spacing.base, // 16px - dentro de tarjetas
  sectionPadding: Spacing.lg, // 24px - entre secciones grandes

  // Gaps (espacios entre elementos)
  gapSmall: Spacing.sm, // 8px - entre elementos muy relacionados
  gapMedium: Spacing.md, // 12px - entre elementos relacionados
  gapLarge: Spacing.base, // 16px - entre elementos diferentes

  // Márgenes estándar
  marginBottom: {
    title: Spacing.lg, // 24px debajo de títulos
    section: Spacing.xl, // 32px entre secciones
    element: Spacing.base, // 16px entre elementos
  },
} as const;

// 4. Crear estilos de texto predefinidos (esto es lo que más te va a ayudar)
export const TextStyles = {
  h1: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xxxl,
    lineHeight: LineHeight.xxxl,
    fontWeight: Typography.fontWeight.bold,
  },
  h2: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.xxl,
    lineHeight: LineHeight.xxl,
    fontWeight: Typography.fontWeight.semibold,
  },
  h3: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.xl,
    lineHeight: LineHeight.xl,
    fontWeight: Typography.fontWeight.semibold,
  },
  body: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: Typography.fontWeight.regular,
  },
  bodyBold: {
    fontFamily: Typography.fontFamily.semibold,
    fontSize: Typography.fontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  caption: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    lineHeight: LineHeight.sm,
    fontWeight: Typography.fontWeight.regular,
  },
  small: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    lineHeight: LineHeight.xs,
    fontWeight: Typography.fontWeight.regular,
  },
  button: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.md,
    lineHeight: LineHeight.md,
    fontWeight: Typography.fontWeight.medium,
  },
} as const;
