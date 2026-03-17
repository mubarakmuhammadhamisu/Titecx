import React from 'react';
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Terms of <span className="text-indigo-400">Service</span>
          </h1>
          <p className="mt-4 text-gray-400">Last Updated: January 22, 2026</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-32 space-y-10">
        <LegalSection title="1. Acceptance of Terms">
          By accessing and using Titecx, you agree to be bound by these Terms of Service and all applicable laws. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
        </LegalSection>

        <LegalSection title="2. Description of Service">
          Titecx provides high-quality online educational courses designed to teach real-world skills. Access to specific courses requires purchase. Courses are subject to availability and we reserve the right to modify, update, or discontinue course content at any time.
        </LegalSection>

        <LegalSection title="3. User Accounts">
          You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorised use of your account. Titecx is not liable for any loss resulting from unauthorised access to your account.
        </LegalSection>

        <LegalSection title="4. Payments, Refunds, and Digital Product Policy">
          All payments are processed securely through Paystack. By completing a purchase on Titecx, you acknowledge and agree to the following refund policy:{" "}
          <br /><br />
          <strong className="text-white">Digital Product Nature:</strong> All courses sold on Titecx are digital products delivered immediately upon payment confirmation. Because access to course content is granted instantly, purchases are generally non-refundable once the course has been accessed or any lesson has been started.{" "}
          <br /><br />
          <strong className="text-white">Eligibility for Refund:</strong> A refund may be granted only if (a) you request it within 24 hours of purchase, and (b) you have not accessed, streamed, or downloaded any part of the course content. Refund requests made after 24 hours or after content has been accessed will not be eligible.{" "}
          <strong className="text-white">How to Request:</strong> To request a refund within the eligible window, email <span className="text-indigo-400">support@Titecx.com</span> with your full name, registered email, and the Paystack payment reference number. We will process eligible refunds within 5–10 business days back to your original payment method.{" "}
          <br /><br />
          <strong className="text-white">Technical Issues:</strong> If you are unable to access content due to a verified technical fault on our platform, contact support within 7 days of purchase. We will investigate and, where the fault is confirmed, offer a full refund or equivalent course credit at our discretion.{" "}
          <br /><br />
          <strong className="text-white">Chargebacks:</strong> Initiating a chargeback or payment dispute with your bank or card provider without first contacting our support team may result in immediate suspension of your account and forfeiture of access to all enrolled courses.
        </LegalSection>

        <LegalSection title="5. Intellectual Property">
          All course content — including videos, text, images, and code — is the exclusive property of Titecx and its instructors. You may not reproduce, distribute, or create derivative works without explicit written permission.
        </LegalSection>

        <LegalSection title="6. User Conduct">
          Users agree to use the platform for lawful purposes only. You must not share account credentials, redistribute paid course content, or use the platform to harass, spam, or harm other users.
        </LegalSection>

        <LegalSection title="7. Limitation of Liability">
          Titecx is provided on an "as is" basis. We make no warranties regarding the accuracy or completeness of course content. To the maximum extent permitted by law, Titecx shall not be liable for any indirect, incidental, or consequential damages.
        </LegalSection>

        <LegalSection title="8. Changes to Terms">
          We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms. We will notify users of material changes via email or an in-app notice.
        </LegalSection>

        <LegalSection title="9. Contact">
          If you have any questions about these Terms or wish to submit a refund request, please email us at <span className="text-indigo-400">support@Titecx.com</span>. We aim to respond to all enquiries within 2 business days.
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
