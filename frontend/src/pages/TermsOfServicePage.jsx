import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-midnight-navy text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-midnight-navy/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container-custom mx-auto px-4 py-4 max-w-3xl flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
      </nav>

      <div className="container-custom mx-auto py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-10">Last Updated: March 2026</p>

        <div className="space-y-6 text-gray-100 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using CALCULATECO2, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">2. Service Provision</h2>
            <p>
              The provider grants a limited, non-exclusive, revocable right to access the SaaS platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">3. User Obligations</h2>
            <p>
              Users must not abuse the service, attempt to hack it, or violate third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Subscription and Payment</h2>
            <p>
              Possible fees are paid in advance and are non-refundable. Subscriptions auto-renew unless cancelled.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Data Protection (GDPR)</h2>
            <p>
              We process data in accordance with our Privacy Policy and applicable data protection laws, including the
              GDPR where relevant.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, CALCULATECO2 is not liable for indirect or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-2">7. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Germany.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

