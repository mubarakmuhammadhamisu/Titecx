"use client";

import { useState } from "react";
import AuthFormWrapper from "@/components/ui/auth/AuthFormWrapper";
import AuthInput from "@/components/ui/auth/AuthInput";
import AuthButton from "@/components/ui/auth/AuthButton";
import Link from "next/link";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // TODO: CONNECT API HERE
    // await fetch("/api/auth/signup", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ name, email, password }),
    // })

    setLoading(false);
  }

  return (
    <AuthFormWrapper
      title="Create an account"
      subtitle="Start learning in minutes"
    >
      <form onSubmit={handleSignup} className="space-y-4">
        <AuthInput
          label="Full Name"
          placeholder="Your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <AuthInput
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthInput
          label="Password"
          type="password"
          placeholder="Create a strong password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <AuthButton label="Create account" loading={loading} />
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthFormWrapper>
  );
}
