type BusinessThemeInput = {
  template?: string | null;
  primaryColor?: string | null;
  accentColor?: string | null;
};

function normalizeHex(value: string | null | undefined, fallback: string) {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)
    ? value
    : fallback;
}

function luminance(hexColor: string) {
  const channels = hexColor
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function readableText(hexColor: string) {
  return luminance(hexColor) > 0.179 ? "#111827" : "#FFFFFF";
}

function contrastRatio(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

export function getBusinessTheme(theme?: BusinessThemeInput | null) {
  const primaryColor = normalizeHex(theme?.primaryColor, "#0F172A");
  const accentColor = normalizeHex(theme?.accentColor, "#06B6D4");

  return {
    template: ["default", "minimal", "bold"].includes(theme?.template ?? "")
      ? theme!.template!
      : "default",
    primaryColor,
    accentColor,
    primaryText: readableText(primaryColor),
    accentText: readableText(accentColor),
    accentLabelColor:
      contrastRatio(primaryColor, accentColor) >= 4.5
        ? accentColor
        : readableText(primaryColor),
  };
}
