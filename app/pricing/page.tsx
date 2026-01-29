import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { pricingPlans } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 py-24 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="mt-6 text-gray-300 text-lg">
            Choose a plan that fits your learning goals. No hidden fees.
          </p>
        </div>
      </section>

      {/* PRICING CARDS */}
      <section className="max-w-7xl mx-auto px-4 py-20 grid md:grid-cols-3 gap-6">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`p-6 rounded-2xl border ${
              plan.highlighted
                ? "border-indigo-500 bg-gray-900"
                : "border-white/10 bg-gray-900"
            }`}
          >
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="mt-2 text-sm text-gray-400">{plan.description}</p>

            <div className="mt-6 text-3xl font-extrabold">{plan.price}</div>

            <ul className="mt-6 space-y-2 text-sm text-gray-300">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`mt-8 block text-center px-4 py-3 rounded-xl font-semibold ${
                plan.highlighted
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-900"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </section>

      {/* FOOT NOTE */}
      <section className="text-center text-sm text-gray-400 pb-24">
        <p>
          Not sure which plan is right for you? Start free and upgrade anytime.
        </p>
      </section>

      <Footer />
    </main>
  );
}
