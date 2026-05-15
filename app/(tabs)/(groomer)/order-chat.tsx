/**
 * app/(tabs)/(groomer)/order-chat.tsx
 *
 * Re-export del componente de chat compartido.
 * Al estar dentro del árbol /(tabs)/(groomer)/, el groomer
 * siempre navega dentro de su propio layout y tab bar — sin
 * cruzarse con el árbol del usuario.
 *
 * El componente real vive en app/(screens)/order-chat.tsx.
 */
export { default } from "../../(screens)/order-chat";
