import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-midnight-navy text-white">
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

          <section className="pt-4 text-sm text-gray-400">
            <p>
              This is interim wording and may be replaced by a more detailed version in the future.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;

