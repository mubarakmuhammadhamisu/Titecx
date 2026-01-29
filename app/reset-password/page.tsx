"use client";

import { useState } from "react";
import AuthFormWrapper from "@/components/ui/auth/AuthFormWrapper";
import AuthInput from "@/components/ui/auth/AuthInput";
import AuthButton from "@/components/ui/auth/AuthButton";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: API RESET PASSWORD
    // await fetch("/api/auth/reset-password", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ email }),
    // })

    setLoading(false);
    setSent(true);
  }

  return (
    <AuthFormWrapper
      title="Reset your password"
      subtitle="We’ll send you a link to reset it"
    >
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            If an account exists for <b>{email}</b>, a reset link has been sent.
          </p>

          <Link href="/login" className="text-sm text-primary hover:underline">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <AuthInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <AuthButton label="Send reset link" loading={loading} />
        </form>
      )}
    </AuthFormWrapper>
  );
}
