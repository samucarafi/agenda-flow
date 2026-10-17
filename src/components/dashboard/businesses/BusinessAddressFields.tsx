"use client";

import { useState } from "react";
import { FiMapPin, FiSearch } from "react-icons/fi";

export type BusinessAddress = {
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type Props = {
  initialAddress?: Partial<BusinessAddress> | null;
};

const emptyAddress: BusinessAddress = {
  zipCode: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400";

export function BusinessAddressFields({ initialAddress }: Props) {
  const [address, setAddress] = useState<BusinessAddress>({
    ...emptyAddress,
    ...initialAddress,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function updateField(field: keyof BusinessAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function searchZipCode() {
    const zipCode = address.zipCode.replace(/\D/g, "");

    if (zipCode.length !== 8) {
      setMessage("Digite um CEP válido com 8 números.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`https://viacep.com.br/ws/${zipCode}/json/`);

      if (!response.ok) {
        throw new Error("Falha na consulta");
      }

      const data: {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      } = await response.json();

      if (data.erro) {
        setMessage(
          "CEP não encontrado. Confira o número ou preencha o endereço manualmente.",
        );
        return;
      }

      setAddress((current) => ({
        ...current,
        zipCode: `${zipCode.slice(0, 5)}-${zipCode.slice(5)}`,
        street: data.logradouro || current.street,
        neighborhood: data.bairro || current.neighborhood,
        city: data.localidade || current.city,
        state: data.uf || current.state,
      }));

      setMessage("CEP encontrado. Confira os dados e complete o número.");
    } catch {
      setMessage(
        "Não foi possível consultar o CEP. Preencha o endereço manualmente.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-7">
      <div className="flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
          <FiMapPin size={21} />
        </div>

        <div>
          <h2 className="text-lg font-semibold">Endereço do estabelecimento</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Cadastre o endereço completo para ajudar seus clientes a encontrar o
            local correto no mapa.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="addressZipCode"
            className="mb-2 block text-sm text-slate-300"
          >
            CEP
          </label>

          <div className="flex gap-2">
            <input
              id="addressZipCode"
              name="addressZipCode"
              value={address.zipCode}
              onChange={(event) =>
                updateField("zipCode", event.target.value.slice(0, 9))
              }
              onBlur={() => {
                if (address.zipCode.replace(/\D/g, "").length === 8) {
                  void searchZipCode();
                }
              }}
              autoComplete="postal-code"
              inputMode="numeric"
              placeholder="00000-000"
              maxLength={9}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => void searchZipCode()}
              disabled={loading}
              aria-label="Consultar CEP"
              className="flex shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 text-cyan-300 transition hover:bg-cyan-400/20 disabled:opacity-50"
            >
              <FiSearch size={18} />
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="addressStreet"
            className="mb-2 block text-sm text-slate-300"
          >
            Rua ou avenida
          </label>
          <input
            id="addressStreet"
            name="addressStreet"
            value={address.street}
            onChange={(event) => updateField("street", event.target.value)}
            autoComplete="address-line1"
            maxLength={150}
            placeholder="Nome da rua"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="addressNumber"
            className="mb-2 block text-sm text-slate-300"
          >
            Número
          </label>
          <input
            id="addressNumber"
            name="addressNumber"
            value={address.number}
            onChange={(event) => updateField("number", event.target.value)}
            maxLength={20}
            placeholder="Número ou s/n"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="addressComplement"
            className="mb-2 block text-sm text-slate-300"
          >
            Complemento (opcional)
          </label>
          <input
            id="addressComplement"
            name="addressComplement"
            value={address.complement}
            onChange={(event) => updateField("complement", event.target.value)}
            autoComplete="address-line2"
            maxLength={100}
            placeholder="Sala, loja, bloco..."
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="addressNeighborhood"
            className="mb-2 block text-sm text-slate-300"
          >
            Bairro
          </label>
          <input
            id="addressNeighborhood"
            name="addressNeighborhood"
            value={address.neighborhood}
            onChange={(event) =>
              updateField("neighborhood", event.target.value)
            }
            autoComplete="address-level3"
            maxLength={100}
            placeholder="Nome do bairro"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="addressCity"
            className="mb-2 block text-sm text-slate-300"
          >
            Cidade
          </label>
          <input
            id="addressCity"
            name="addressCity"
            value={address.city}
            onChange={(event) => updateField("city", event.target.value)}
            autoComplete="address-level2"
            maxLength={100}
            placeholder="Nome da cidade"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="addressState"
            className="mb-2 block text-sm text-slate-300"
          >
            Estado (UF)
          </label>
          <input
            id="addressState"
            name="addressState"
            value={address.state}
            onChange={(event) =>
              updateField("state", event.target.value.toUpperCase().slice(0, 2))
            }
            autoComplete="address-level1"
            maxLength={2}
            placeholder="RJ"
            className={inputClass}
          />
        </div>
      </div>

      <p
        role="status"
        aria-live="polite"
        className="mt-3 min-h-5 text-xs text-slate-400"
      >
        {loading ? "Consultando CEP..." : message}
      </p>

      <p className="mt-2 text-xs leading-5 text-slate-500">
        A consulta do CEP preenche os campos disponíveis. Confira o número, o
        bairro e a cidade antes de salvar.
      </p>
    </section>
  );
}
