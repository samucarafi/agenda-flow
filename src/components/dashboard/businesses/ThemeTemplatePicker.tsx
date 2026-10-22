"use client";

import { useState } from "react";
import { getBusinessTheme } from "@/lib/business-theme";

type Template = "default" | "minimal" | "bold";
type Palette = { name: string; primary: string; accent: string; mood: string };

const templates: { id: Template; title: string; description: string; layout: string }[] = [
  { id: "default", title: "Clássico", description: "Equilibrado e acolhedor, com cartões bem definidos.", layout: "Ideal para apresentar serviços ou cardápios de forma familiar." },
  { id: "minimal", title: "Minimalista", description: "Mais espaço, linhas delicadas e poucos elementos decorativos.", layout: "Ideal para uma página discreta, limpa e com foco no conteúdo." },
  { id: "bold", title: "Marcante", description: "Destaques coloridos, cartões expressivos e chamadas fortes.", layout: "Ideal para uma marca vibrante que quer chamar atenção." },
];

const palettes: Palette[] = [
  { name: "Azul noturno", primary: "#0F172A", accent: "#22D3EE", mood: "moderno e confiável" },
  { name: "Floresta", primary: "#142B24", accent: "#A3E635", mood: "natural e fresco" },
  { name: "Vinho", primary: "#341523", accent: "#FB7185", mood: "elegante e acolhedor" },
  { name: "Terracota", primary: "#38251D", accent: "#FDBA74", mood: "artesanal e caloroso" },
  { name: "Claro e elegante", primary: "#F1F5F9", accent: "#4F46E5", mood: "leve e contemporâneo" },
];

export function ThemeTemplatePicker({
  initialTemplate,
  initialPrimaryColor,
  initialAccentColor,
}: {
  initialTemplate: string;
  initialPrimaryColor: string;
  initialAccentColor: string;
}) {
  const [template, setTemplate] = useState<Template>(
    templates.some((item) => item.id === initialTemplate) ? initialTemplate as Template : "default",
  );
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [accentColor, setAccentColor] = useState(initialAccentColor);
  const selectedPalette = palettes.find((palette) =>
    palette.primary.toLowerCase() === primaryColor.toLowerCase() &&
    palette.accent.toLowerCase() === accentColor.toLowerCase(),
  );
  const readablePrimaryText = getBusinessTheme({ primaryColor }).primaryText;
  const previewSurface = `color-mix(in srgb, ${primaryColor} 94%, ${readablePrimaryText})`;
  const previewText = getBusinessTheme({ primaryColor }).primaryText;

  function choosePalette(palette: Palette) {
    setPrimaryColor(palette.primary);
    setAccentColor(palette.accent);
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Aparência da página pública</p>
        <h2 className="mt-2 text-lg font-semibold text-white">Identidade visual</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
          Monte uma combinação de cores e escolha um layout. A prévia abaixo acompanha suas escolhas.
        </p>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Comece com uma paleta combinada</h3>
            <p className="mt-1 text-xs text-slate-400">As combinações já foram escolhidas para funcionar juntas.</p>
          </div>
          {selectedPalette && <span className="text-xs font-medium text-emerald-300">Paleta {selectedPalette.name} selecionada</span>}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {palettes.map((palette) => {
            const selected = selectedPalette?.name === palette.name;
            return (
              <button
                key={palette.name}
                type="button"
                aria-pressed={selected}
                onClick={() => choosePalette(palette)}
                className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${selected ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-slate-900/60 hover:border-white/25"}`}
              >
                <span className="flex items-center gap-2">
                  <span className="flex overflow-hidden rounded-full border border-white/20">
                    <span className="size-5" style={{ backgroundColor: palette.primary }} />
                    <span className="size-5" style={{ backgroundColor: palette.accent }} />
                  </span>
                  <span className="text-sm font-semibold text-white">{palette.name}</span>
                </span>
                <span className="mt-2 block text-xs text-slate-400">{palette.mood}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <ColorField
          name="primaryColor"
          label="Cor principal · fundo"
          hint="Usada no fundo da página. Tons médios ou escuros dão mais destaque ao conteúdo."
          value={primaryColor}
          onChange={setPrimaryColor}
        />
        <ColorField
          name="accentColor"
          label="Cor de destaque · botões"
          hint="Usada em ações e detalhes. Prefira uma cor viva que contraste com o fundo."
          value={accentColor}
          onChange={setAccentColor}
        />
      </div>
      <p className="mt-3 rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-xs leading-5 text-slate-300">
        O texto dos botões e títulos escolhe automaticamente uma cor legível. Para um resultado equilibrado, use uma cor escura no fundo e uma cor clara ou viva nos destaques.
      </p>

      <fieldset className="mt-7">
        <legend className="text-sm font-semibold text-slate-100">Escolha o layout</legend>
        <p className="mt-1 text-xs text-slate-400">O mesmo conteúdo e as mesmas cores são apresentados de formas diferentes.</p>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {templates.map((item) => {
            const selected = template === item.id;
            return (
              <label key={item.id} className={`cursor-pointer rounded-2xl border p-3 transition focus-within:ring-2 focus-within:ring-cyan-400 ${selected ? "border-cyan-300 bg-cyan-300/[0.08]" : "border-white/10 bg-slate-900/40 hover:border-white/25"}`}>
                <input className="sr-only" type="radio" name="themeTemplate" value={item.id} checked={selected} onChange={() => setTemplate(item.id)} />
                <PagePreview template={item.id} primaryColor={primaryColor} accentColor={accentColor} primaryText={previewText} surface={previewSurface} />
                <span className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold text-white">
                  {item.title}
                  {selected && <span className="rounded-full bg-cyan-300/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">Selecionado</span>}
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-300">{item.description}</span>
                <span className="mt-2 block text-[11px] leading-4 text-slate-400">{item.layout}</span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

function PagePreview({
  template,
  primaryColor,
  accentColor,
  primaryText,
  surface,
}: {
  template: Template;
  primaryColor: string;
  accentColor: string;
  primaryText: string;
  surface: string;
}) {
  const radius = template === "minimal" ? "rounded-lg" : template === "bold" ? "rounded-2xl" : "rounded-xl";
  const background = template === "minimal"
    ? primaryColor
    : template === "bold"
      ? `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 76%, ${accentColor}))`
      : `linear-gradient(145deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 94%, ${accentColor}))`;
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden border ${radius} ${template === "minimal" ? "border-white/10" : template === "bold" ? "border-white/20 shadow-lg" : "border-white/10 shadow-sm"}`}
      style={{ background: background, color: primaryText }}
    >
      <div className="flex h-7 items-center justify-between border-b border-current/10 px-3">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: accentColor }} /><span className="h-1.5 w-10 rounded-full bg-current/60" /></span>
        <span className="h-1.5 w-8 rounded-full bg-current/30" />
      </div>
      <div className={`${template === "bold" ? "p-3" : template === "minimal" ? "p-4" : "p-3.5"}`}>
        <div className={`${template === "bold" ? "p-3" : "p-2"} ${radius}`} style={template === "bold" ? { background: `linear-gradient(135deg, ${primaryColor}, color-mix(in srgb, ${primaryColor} 76%, ${accentColor}))` } : undefined}>
          <span className="block h-1.5 w-10 rounded-full opacity-70" style={{ backgroundColor: accentColor }} />
          <span className={`mt-2 block h-2.5 w-2/3 ${radius}`} style={{ backgroundColor: primaryText, opacity: 0.88 }} />
          <span className={`mt-1.5 block h-1.5 w-1/2 ${radius}`} style={{ backgroundColor: primaryText, opacity: 0.42 }} />
          <span className={`mt-3 inline-flex h-5 w-16 ${template === "minimal" ? "rounded-md" : "rounded-lg"}`} style={{ backgroundColor: accentColor }} />
        </div>
        <div className={`mt-2 flex items-center gap-2 border p-2 ${radius} ${template === "minimal" ? "border-current/15 shadow-none" : "border-current/10 shadow-sm"}`} style={{ backgroundColor: surface }}>
          <span className={`size-7 shrink-0 ${radius}`} style={{ backgroundColor: accentColor, opacity: 0.8 }} />
          <span className="flex-1"><span className="block h-1.5 w-2/3 rounded-full" style={{ backgroundColor: primaryText, opacity: 0.75 }} /><span className="mt-1.5 block h-1 w-1/2 rounded-full" style={{ backgroundColor: primaryText, opacity: 0.35 }} /></span>
          <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>
      </div>
    </div>
  );
}

function ColorField({
  name,
  label,
  hint,
  value,
  onChange,
}: {
  name: string;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="text-sm">
      <span className="mb-2 block font-medium text-slate-200">{label}</span>
      <span className="flex items-center gap-3 rounded-xl border border-white/15 bg-slate-900 p-2.5">
        <input
          type="color"
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent"
        />
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase text-slate-100">{value}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-400">{hint}</span>
        </span>
      </span>
    </label>
  );
}
