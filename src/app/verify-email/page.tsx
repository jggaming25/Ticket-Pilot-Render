"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Ticket } from "lucide-react";
import { Suspense } from "react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
          {error ? (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Fehler</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Email bestätigt!</h1>
              <p className="text-muted-foreground mb-6">
                Deine Email wurde erfolgreich bestätigt. Du kannst dich jetzt
                einloggen.
              </p>
            </>
          )}

          <Link
            href="/login"
            className="inline-block rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            Zum Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Laden...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
