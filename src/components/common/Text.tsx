import React from "react";
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from "react-native";
import { Typography } from "@/constants/theme";

interface TextProps extends RNTextProps {
  variant?:
    | "light"
    | "regular"
    | "medium"
    | "semibold"
    | "bold"
    | "extrabold"
    | "black";
}

export const Text: React.FC<TextProps> = ({
  variant = "regular",
  style,
  ...props
}) => {
  const fontFamily = Typography.fontFamily[variant];

  return <RNText style={[{ fontFamily }, style]} {...props} />;
};
