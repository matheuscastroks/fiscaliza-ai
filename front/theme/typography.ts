import { TextStyle } from "react-native";

export const fontFamilies = {
  regular: "InstrumentSans_400Regular",
  medium: "InstrumentSans_500Medium",
  semibold: "InstrumentSans_600SemiBold",
  bold: "InstrumentSans_700Bold",
} as const;

export function fontForWeight(weight: TextStyle["fontWeight"]) {
  const value = weight === "bold" ? 700 : Number(weight || 400);
  return value >= 700
    ? fontFamilies.bold
    : value >= 600
      ? fontFamilies.semibold
      : value >= 500
        ? fontFamilies.medium
        : fontFamilies.regular;
}

/**
 * Fiscaliza aí — Escala Tipográfica (V2)
 * Tipografia nativa e legível para formulários e fichas territoriais.
 */

export const typography: Record<string, TextStyle> = {
  screenTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  label: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500",
  },
  meta: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  protocol: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400",
  },
};

export type TypographyVariant = keyof typeof typography;
