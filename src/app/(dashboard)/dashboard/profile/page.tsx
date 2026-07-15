"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Moon, Sun } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Input, Button } from "@/components/ui";
import QRCode from "qrcode";
import { apiFetch, ApiError } from "@/lib/http-client";
import { useTheme } from "@/components/theme-provider";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  locale: string;
  theme: string;
  twoFactorEnabled: boolean;
};

export default function ProfilePage() {
  const { theme: siteTheme, setTheme: setSiteTheme } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [locale, setLocale] = useState("");
  const [themeField, setThemeField] = useState<"dark" | "light">("dark");
  const [saving, setSaving] = useState(false);

  const [token, setToken] = useState("");
  const [qr, setQr] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");

  useEffect(() => {
    apiFetch<Profile>("/api/users/me").then((data) => {
      setProfile(data);
      setName(data.name);
      setLocale(data.locale);
      const normalized = data.theme === "light" ? "light" : "dark";
      setThemeField(normalized);
      setSiteTheme(normalized);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const updated = await apiFetch<Profile>("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ name, locale, theme: themeField })
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      setSiteTheme(themeField);
      toast.success("Perfil atualizado com sucesso.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao guardar perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function setup2FA() {
    try {
      const data = await apiFetch<{ otpauth: string; secret: string }>("/api/auth/2fa/setup", { method: "POST" });
      setTwoFactorSecret(data.secret); // BUG FIX: Armazenar o secret para enviar na verificação
      const qrDataUrl = await QRCode.toDataURL(data.otpauth, {
        margin: 2,
        width: 200,
        color: { dark: "#FFFFFF", light: "#151515" }
      });
      setQr(qrDataUrl);
      toast.info("2FA inicializado. Escaneie o QR e valide o código.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Erro ao gerar QR Code.");
    }
  }

  async function verify2FA() {
    try {
      // BUG FIX: Enviar o secret junto com o token para verificação
      await apiFetch("/api/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ token, secret: twoFactorSecret })
      });
      toast.success("2FA ativado com sucesso.");
      setProfile((prev) => (prev ? { ...prev, twoFactorEnabled: true } : prev));
      setQr("");
      setToken("");
      setTwoFactorSecret("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Token inválido.");
    }
  }

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" type="email" value={profile?.email ?? ""} disabled />
            <Input placeholder="Idioma" value={locale} onChange={(e) => setLocale(e.target.value)} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setThemeField("dark")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  themeField === "dark" ? "border-light bg-hover text-foreground" : "border-border text-muted hover:bg-hover"
                }`}
              >
                <Moon className="h-4 w-4" /> Escuro
              </button>
              <button
                type="button"
                onClick={() => setThemeField("light")}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                  themeField === "light" ? "border-light bg-hover text-foreground" : "border-border text-muted hover:bg-hover"
                }`}
              >
                <Sun className="h-4 w-4" /> Claro
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? "A guardar..." : "Guardar alterações"}
            </Button>
            {!profile?.twoFactorEnabled ? (
              <Button className="bg-card text-foreground" onClick={setup2FA}>
                Configurar 2FA
              </Button>
            ) : (
              <span className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                2FA ativo
              </span>
            )}
          </div>
          {qr ? (
            <div className="mt-4 flex max-w-[240px] flex-col items-center justify-center rounded-2xl border border-border bg-[#151515] p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="2FA QR code" className="rounded-xl" />
              <span className="mt-2 text-xs text-muted">2FA Authenticator QR</span>
            </div>
          ) : null}
          {qr ? (
            <div className="mt-6 flex max-w-sm gap-2">
              <Input placeholder="Código 2FA" value={token} onChange={(e) => setToken(e.target.value)} />
              <Button className="bg-success text-black" onClick={verify2FA}>
                Verificar
              </Button>
            </div>
          ) : null}
          <p className="mt-4 text-xs text-muted">Tema atual da interface: {siteTheme === "dark" ? "Escuro" : "Claro"}</p>
        </div>
      </section>
    </main>
  );
}
