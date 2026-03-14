import React from 'react';
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Privacy <span className="text-indigo-400">Policy</span>
          </h1>
          <p className="mt-4 text-gray-400">Last Updated: January 22, 2026</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-32 space-y-10">
        <LegalSection title="1. Information We Collect">
          We collect information you provide directly when creating an account — your name, email address, and optionally your profile photo, phone number, location, and bio. We also collect course progress data and payment transaction references processed through Paystack.
        </LegalSection>

        <LegalSection title="2. How We Use Your Information">
          We use your information to provide and improve the Learnify platform, process course enrollments, track your learning progress, send account-related communications, and personalise your experience. We do not sell your personal data to third parties.
        </LegalSection>

        <LegalSection title="3. Payment Data">
          Learnify does not store your card details. All payments are handled by Paystack, a PCI-DSS compliant payment processor. We only store a payment reference ID to confirm your enrollment. Please review Paystack's privacy policy for details on how they handle payment data.
        </LegalSection>

        <LegalSection title="4. Data Storage and Security">
          Your data is stored securely using Supabase infrastructure hosted on cloud servers. We apply industry-standard security practices including encrypted connections (HTTPS), row-level database security, and access controls. However, no transmission over the internet is 100% secure.
        </LegalSection>

        <LegalSection title="5. Cookies and Analytics">
          Learnify uses authentication cookies to keep you logged in across sessions. We may use anonymised analytics to understand how users interact with the platform. These do not identify you personally.
        </LegalSection>

        <LegalSection title="6. Your Rights">
          You may request access to, correction of, or deletion of your personal data at any time by using the "Delete Account" feature in your profile settings, or by contacting our support team. Account deletion removes your profile, enrollments, and progress data permanently.
        </LegalSection>

        <LegalSection title="7. Data Retention">
          We retain your personal data for as long as your account is active. Upon account deletion, personal data is removed within 30 days. Payment records may be retained for up to 7 years as required by Nigerian financial regulations.
        </LegalSection>

        <LegalSection title="8. NDPR Compliance (Nigeria Data Protection Regulation)">
          Learnify is fully committed to compliance with the Nigeria Data Protection Regulation (NDPR) issued by the National Information Technology Development Agency (NITDA). We process your personal data in accordance with the following principles:{" "}
          <br /><br />
          <strong className="text-white">Lawful Basis:</strong> We collect and process your data only where we have a lawful basis to do so — specifically, to perform the contract of service (providing courses you have enrolled in) and to comply with our legal obligations under Nigerian law.{" "}
          <br /><br />
          <strong className="text-white">Purpose Limitation:</strong> Your data is collected solely for educational purposes — to create and manage your account, process course enrollments, track your learning progress, issue certificates of completion, and communicate service-related updates. We do not use your data for unrelated advertising or sell it to any third party.{" "}
          <br /><br />
          <strong className="text-white">Data Storage:</strong> All personal data is stored securely via Supabase, a cloud database platform with enterprise-grade security. Data is encrypted at rest and in transit using industry-standard TLS/SSL protocols. Row-Level Security (RLS) ensures that each user can only access their own data.{" "}
          <br /><br />
          <strong className="text-white">Data Subject Rights:</strong> Under the NDPR, you have the right to: access a copy of your personal data; request correction of inaccurate data; withdraw consent to data processing; and request deletion of your data. You may exercise any of these rights by using the &quot;Delete Account&quot; option in your Profile Settings, or by contacting our Data Protection Officer at <span className="text-indigo-400">privacy@learnify.com</span>.{" "}
          <br /><br />
          <strong className="text-white">Data Deletion:</strong> To request full deletion of your personal data outside of the in-app account deletion flow, email <span className="text-indigo-400">privacy@learnify.com</span> with the subject line &quot;Data Deletion Request&quot; and your registered email address. We will confirm deletion within 14 days.
        </LegalSection>

        <LegalSection title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email or an in-app notice. Continued use of the platform after changes constitutes acceptance of the revised policy.
        </LegalSection>

        <LegalSection title="10. Contact">
          If you have questions about this Privacy Policy, wish to exercise your data rights, or need to submit a Data Deletion Request, please contact our Data Protection Officer at <span className="text-indigo-400">privacy@learnify.com</span>. For general support enquiries, email <span className="text-indigo-400">support@learnify.com</span>. We aim to respond within 2 business days.
        </LegalSection>
      </section>

      <Footer />
    </main>
  );
}

function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
      <h2 className="text-xl font-semibold text-white mb-3">{title}</h2>
      <p className="text-gray-300 leading-relaxed">{children}</p>
    </div>
  );
}
