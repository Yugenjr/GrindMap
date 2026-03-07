import React from 'react';
import './Legal.css';

const TermsConditions = () => {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div>
          <p className="eyebrow">Legal</p>
          <h1>Terms & Conditions</h1>
          <p className="lede">
            Rules and guidelines for using GrindMap.
          </p>
        </div>
      </header>

      <section className="legal-card">
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By using GrindMap, you agree to these Terms & Conditions. If you do
          not agree, you should not use the platform.
        </p>

        <h2>2. Use of Service</h2>
        <ul>
          <li>Use the app only for lawful and personal productivity purposes</li>
          <li>Do not attempt to break, overload, or exploit the system</li>
          <li>Do not misuse APIs or automated goal updates</li>
        </ul>

        <h2>3. User Content</h2>
        <p>
          Goals, descriptions, and notes you create remain your content. However,
          you grant the app permission to store and process them to provide features.
        </p>

        <h2>4. Availability</h2>
        <p>
          The service is provided “as is”. Uptime and availability are not guaranteed.
          Features may change without prior notice.
        </p>

        <h2>5. Account Responsibility</h2>
        <p>
          You are responsible for maintaining your login credentials and activity
          under your account.
        </p>

        <h2>6. Limitation of Liability</h2>
        <p>
          GrindMap is not liable for productivity outcomes, lost data, or indirect
          damages arising from use of the platform.
        </p>

        <h2>7. Termination</h2>
        <p>
          Accounts may be suspended if misuse or abuse of the system is detected.
        </p>

        <h2>8. Changes to Terms</h2>
        <p>
          Terms may be updated over time. Continued use indicates acceptance of
          revised terms.
        </p>

        <h2>9. Contact</h2>
        <p>
          For questions regarding these terms, contact the project maintainer via
          the GrindMap repository.
        </p>
      </section>
    </div>
  );
};

export default TermsConditions;
