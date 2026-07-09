"use client";

import { useEffect, useState } from "react";

export default function DocsPage() {
  const [spec, setSpec] = useState<any>(null);
  useEffect(() => {
    fetch("/api/docs")
      .then((r) => r.json())
      .then(setSpec);
  }, []);

  return (
    <main className="page-shell">
      <div className="card glass p-6">
        <h1 className="text-2xl font-semibold">Swagger / OpenAPI</h1>
        <p className="mt-1 text-sm text-muted">Especificação carregada de `/api/docs`.</p>
        <pre className="mt-4 overflow-auto rounded-xl border border-border bg-bg p-4 text-xs text-muted">
          {JSON.stringify(spec, null, 2)}
        </pre>
      </div>
    </main>
  );
}
