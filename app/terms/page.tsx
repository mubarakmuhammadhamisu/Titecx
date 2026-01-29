import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-gray-100">
      <Link href="/" className="text-indigo-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <p className="mb-4 text-gray-400 italic">Last Updated: January 22, 2026</p>
      
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-300">By accessing and using this platform, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-3">2. Description of Service</h2>
          <p className="text-gray-300">We provide high-quality educational courses designed for real-world skills. Courses are subject to availability and we reserve the right to modify or discontinue services.</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-3">3. User Conduct</h2>
          <p className="text-gray-300">Users agree to use the platform for lawful purposes only and are responsible for all content they post or share.</p>
        </div>
      </section>
    </div>
  );
}
