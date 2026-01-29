import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-gray-100">
      <Link href="/" className="text-indigo-400 hover:underline mb-8 inline-block">&larr; Back to Home</Link>
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <p className="mb-4 text-gray-400 italic">Last Updated: January 22, 2026</p>
      
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-300">We collect information you provide directly to us when you create an account, such as your name and email address.</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-3">2. How We Use Information</h2>
          <p className="text-gray-300">We use your information to provide, maintain, and improve our services, and to communicate with you about your account.</p>
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-3">3. Data Security</h2>
          <p className="text-gray-300">We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access.</p>
        </div>
      </section>
    </div>
  );
}
