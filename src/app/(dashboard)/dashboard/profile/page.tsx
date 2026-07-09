"use client";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/dashboard/topbar";
import { Input, Button } from "@/components/ui";
import QRCode from "qrcode";

export default function ProfilePage() {
  const [token, setToken] = useState("");
  const [qr, setQr] = useState("");
  const [message, setMessage] = useState("");

  async function setup2FA() {
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    const data = await res.json();
    if (data?.otpauth) {
      try {
        const qrDataUrl = await QRCode.toDataURL(data.otpauth, {
          margin: 2,
          width: 200,
          color: {
            dark: "#FFFFFF",
            light: "#151515" // BG color card to match theme
          }
        });
        setQr(qrDataUrl);
        setMessage("2FA inicializado. Escaneie o QR e valide o código.");
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
        setMessage("Erro ao gerar QR Code localmente.");
      }
    }
  }

  async function verify2FA() {
    const res = await fetch("/api/auth/2fa/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    setMessage(res.ok ? "2FA ativado com sucesso." : "Token inválido.");
  }

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-[260px_1fr]">
      <Sidebar />
      <section>
        <Topbar />
        <div className="card glass p-6">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Input placeholder="Nome" />
            <Input placeholder="Email" type="email" />
            <Input placeholder="Idioma" />
            <Input placeholder="Tema" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button>Guardar alterações</Button>
            <Button className="bg-card text-foreground" onClick={setup2FA}>
              Configurar 2FA
            </Button>
          </div>
          {qr ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-border bg-[#151515] p-4 max-w-[240px]">
              <img src={qr} alt="2FA QR code" className="rounded-xl" />
              <span className="mt-2 text-xs text-muted">2FA Authenticator QR</span>
            </div>
          ) : null}
          <div className="mt-6 flex gap-2 max-w-sm">
            <Input placeholder="Código 2FA" value={token} onChange={(e) => setToken(e.target.value)} />
            <Button className="bg-success text-black" onClick={verify2FA}>
              Verificar
            </Button>
          </div>
          {message ? <p className="mt-2 text-sm text-muted">{message}</p> : null}
        </div>
      </section>
    </main>
  );
}
