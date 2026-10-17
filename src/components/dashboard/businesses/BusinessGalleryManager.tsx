"use client";

import { useRef, useState } from "react";
import { FiCheck, FiImage, FiLoader, FiStar, FiTrash2, FiUploadCloud } from "react-icons/fi";

type GalleryImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

interface BusinessGalleryManagerProps {
  businessId: string;
  initialImages: GalleryImage[];
}

export function BusinessGalleryManager({ businessId, initialImages }: BusinessGalleryManagerProps) {
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [busy, setBusy] = useState(false);
  const [pendingPublicId, setPendingPublicId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    setNotice("");
    const selected = Array.from(files);

    if (images.length + selected.length > 12) {
      setError("Você pode cadastrar até 12 fotos. Remova uma foto antes de enviar mais.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setBusy(true);
    try {
      for (const file of selected) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch(`/api/businesses/${businessId}/gallery`, {
          method: "POST",
          body: formData,
        });
        const payload = (await response.json()) as { error?: string; gallery?: GalleryImage[] };
        if (!response.ok || !payload.gallery) throw new Error(payload.error ?? "Não foi possível enviar a imagem.");
        setImages(payload.gallery);
      }
      setNotice(selected.length === 1 ? "Foto enviada com sucesso." : "Fotos enviadas com sucesso.");
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "O envio falhou. Tente novamente.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function setCover(publicId: string) {
    setPendingPublicId(publicId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/businesses/${businessId}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const payload = (await response.json()) as { error?: string; gallery?: GalleryImage[] };
      if (!response.ok || !payload.gallery) throw new Error(payload.error ?? "Não foi possível definir a capa.");
      setImages(payload.gallery);
      setNotice("Foto de capa atualizada.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível atualizar a capa.");
    } finally {
      setPendingPublicId(null);
    }
  }

  async function removeImage(publicId: string) {
    if (!window.confirm("Deseja remover esta foto do estabelecimento?")) return;
    setPendingPublicId(publicId);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/businesses/${businessId}/gallery`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
      const payload = (await response.json()) as { error?: string; gallery?: GalleryImage[] };
      if (!response.ok || !payload.gallery) throw new Error(payload.error ?? "Não foi possível remover a foto.");
      setImages(payload.gallery);
      setNotice("Foto removida.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível remover a foto.");
    } finally {
      setPendingPublicId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold"><FiImage className="text-cyan-300" /> Fotos do estabelecimento</h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-400">
            Envie até 12 imagens (JPG, PNG, WebP ou AVIF), com no máximo 5 MB cada. A foto marcada como capa será usada nos cards de divulgação.
          </p>
        </div>
        <label className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 ${busy || images.length >= 12 ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? <FiLoader className="animate-spin" /> : <FiUploadCloud />}
          {busy ? "Enviando fotos..." : "Enviar fotos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={busy || images.length >= 12}
            className="sr-only"
            onChange={(event) => void uploadFiles(event.target.files)}
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      {images.length ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image) => (
            <article key={image.publicId} className="overflow-hidden rounded-xl border border-white/10 bg-slate-900">
              <div className="relative aspect-[4/3] bg-slate-800">
                {/* Cloudinary transforms and optimizes these uploaded images. */}
                <img src={image.url} alt="Foto do estabelecimento" loading="lazy" className="h-full w-full object-cover" />
                {image.isCover && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-cyan-300 px-2 py-1 text-[11px] font-bold text-slate-950"><FiStar size={11} /> Capa</span>}
              </div>
              <div className="flex flex-col gap-2 p-2">
                {!image.isCover && <button type="button" disabled={pendingPublicId !== null || busy} onClick={() => void setCover(image.publicId)} className="inline-flex items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5 disabled:opacity-50"><FiCheck /> Definir como capa</button>}
                {image.isCover && <span className="px-2 py-2 text-center text-xs text-cyan-300">Foto principal</span>}
                <button type="button" disabled={pendingPublicId !== null || busy} onClick={() => void removeImage(image.publicId)} className="inline-flex items-center justify-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-red-300 transition hover:bg-red-400/10 disabled:opacity-50">
                  {pendingPublicId === image.publicId ? <FiLoader className="animate-spin" /> : <FiTrash2 />} Remover
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-white/15 px-5 py-10 text-center">
          <FiImage className="mx-auto text-2xl text-slate-500" />
          <p className="mt-3 text-sm font-medium text-slate-200">Sua galeria ainda está vazia</p>
          <p className="mt-1 text-xs text-slate-500">Envie fotos do espaço, da fachada ou do ambiente.</p>
        </div>
      )}
      <p className="mt-3 text-right text-xs text-slate-500">{images.length} de 12 fotos</p>
    </section>
  );
}
