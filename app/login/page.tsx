"use client"

import { useState } from "react"
import AuthFormWrapper from "@/components/ui/auth/AuthFormWrapper"
import AuthInput from "@/components/ui/auth/AuthInput"
import AuthButton from "@/components/ui/auth/AuthButton"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // TODO: API LOGIN
    // await fetch("/api/auth/login", {...})

    setLoading(false)
  }

  return (
    <AuthFormWrapper
      title="Welcome back"
      subtitle="Log in to continue learning"
    >
      <form onSubmit={handleLogin} className="space-y-4">
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Forgot password link */}
        <div className="text-right">
          <Link
            href="/reset-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <AuthButton label="Log in" loading={loading} />
      </form>

      <p className="text-sm text-muted-foreground text-center">
        Don’t have an account?{" "}
        <Link href="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthFormWrapper>
  )
}
