import React from 'react';
import './Legal.css';

const PrivacyPolicy = () => {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div>
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="lede">
            How GrindMap collects, uses, and protects your information.
          </p>
        </div>
      </header>

      <section className="legal-card">
        <p className="legal-updated">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Information We Collect</h2>
        <p>
          GrindMap collects only the information necessary to provide goal tracking
          and progress features. This may include your account details, goals,
          progress data, and platform preferences.
        </p>

        <h2>2. How We Use Information</h2>
        <ul>
          <li>To create and manage your goals and streaks</li>
          <li>To calculate stats and achievements</li>
          <li>To improve performance and user experience</li>
          <li>To maintain system security and prevent abuse</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>
          Your data is stored securely using backend databases and is only
          accessible to authorized systems required to operate the app.
        </p>

        <h2>4. Sharing of Data</h2>
        <p>
          We do not sell or trade your personal data. Data is only shared with
          essential infrastructure services required to run the platform.
        </p>

        <h2>5. Cookies & Session Data</h2>
        <p>
          GrindMap may use session tokens or cookies strictly for authentication
          and login continuity.
        </p>

        <h2>6. User Rights</h2>
        <p>
          You may request deletion of your account and stored data at any time
          through account settings or support contact.
        </p>

        <h2>7. Changes to Policy</h2>
        <p>
          This Privacy Policy may be updated as the platform evolves. Continued
          use means you accept the revised policy.
        </p>

        <h2>8. Contact</h2>
        <p>
          For privacy questions, contact the project maintainer via the GrindMap
          repository or support channel.
        </p>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
