import { Redirect } from "expo-router";

export default function Index() {
  // El _layout.tsx maneja toda la lógica
  return <Redirect href="/(auth)/login" />;
}
