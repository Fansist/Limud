export default function PrivacyPolicy() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: June 2, 2026</p>

      <p>Limud Education Inc. (&quot;Limud&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting the privacy of students, educators, parents, and all users of our platform. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p>

      <h2>1. Information We Collect</h2>
      <h3>Account Information</h3>
      <p>When you register for Limud, we collect your name, email address, role (student, teacher, parent, or administrator), school district or organization, and grade level (for students).</p>

      <h3>Student Enrollment Information (District-Provided)</h3>
      <p>For students enrolled by a district: name, email, role, district, grade level — and (when provided by the district) address, city/state/zip, phone, date of birth, emergency contact name and phone. These are optional and only collected when the district provides them as part of enrollment.</p>

      <h3>Technical and Security Data</h3>
      <p>We also collect IP address and browser user-agent for security logging and rate limiting.</p>

      <h3>Usage Data</h3>
      <p>We collect data about how you interact with the platform, including assignments submitted, AI tutor conversations, time spent on activities, and performance metrics. This data is used to personalize the learning experience and provide analytics.</p>

      <h3>AI Interaction Data</h3>
      <p>Conversations with our AI Tutor are logged to improve the learning experience and to allow teachers and parents to monitor student activity. AI tutor logs are subject to strict access controls.</p>

      <h2>2. How We Use Your Information</h2>
      <ul>
        <li><strong>Personalized Learning:</strong> We use performance data to adapt the difficulty of content, provide spaced repetition scheduling, and recommend study materials.</li>
        <li><strong>Analytics & Reporting:</strong> Teachers and administrators receive aggregated and individual performance reports to identify at-risk students and optimize instruction.</li>
        <li><strong>Parent Visibility:</strong> Parents have access to their child&apos;s grades, assignment submissions, AI tutor feedback, and progress reports.</li>
        <li><strong>Platform Improvement:</strong> We use anonymized, aggregated data to improve our AI models, curriculum recommendations, and user experience.</li>
        <li><strong>Communication:</strong> We may send notifications about assignments, grades, achievements, and platform updates.</li>
      </ul>

      <h2>3. Student Data Protection (FERPA)</h2>
      <p>Limud complies with the Family Educational Rights and Privacy Act (FERPA). We act as a &quot;school official&quot; under FERPA and use student data only for legitimate educational purposes. Parents and eligible students have the right to access and correct their education records.</p>

      <h2>4. Children&apos;s Privacy (COPPA)</h2>
      <p>Limud complies with the Children&apos;s Online Privacy Protection Act (COPPA). For students under 13, we require verifiable parental consent through the school or parent account before collecting personal information. We do not sell children&apos;s data or use it for behavioral advertising.</p>

      <h2>5. Data Security</h2>
      <p>We implement industry-standard security measures including:</p>
      <ul>
        <li>256-bit AES encryption for data at rest</li>
        <li>TLS 1.3 encryption for data in transit</li>
        <li>Role-based access controls (RBAC)</li>
        <li>Regular third-party security audits</li>
        <li>SOC 2 Type II compliance is available on Premium and Enterprise plans; all plans use the same encrypted infrastructure</li>
        <li>Automatic session expiration and secure authentication</li>
      </ul>

      <h2>6. Data Sharing & Third Parties</h2>
      <p>We do not sell, rent, or share personal information with third parties for marketing purposes. We may share data with:</p>
      <ul>
        <li><strong>School administrators</strong> within your district for educational purposes</li>
        <li><strong>Service providers</strong> who assist in operating our platform (hosting, analytics), bound by strict data processing agreements</li>
        <li><strong>Legal requirements</strong> when required by law or to protect our rights</li>
      </ul>

      <h2>6a. Service Providers (Sub-Processors)</h2>
      <p>We use the following sub-processors to operate the Limud platform. Each is bound by a data processing agreement and processes data only on our behalf:</p>
      <ul>
        <li><strong>Render</strong> — hosting infrastructure for limud.co</li>
        <li><strong>Neon</strong> — PostgreSQL database hosting</li>
        <li><strong>Resend</strong> — transactional email (password resets, OTP codes, contact form)</li>
        <li><strong>Google Gemini API</strong> — AI processing for our tutor, study material generation, and grading features</li>
      </ul>
      <p>AI prompts and student input are sent to Google for processing under Google&apos;s API terms; we do not allow Google to train models on this data.</p>

      <h2>6b. Cookies and Local Storage</h2>
      <p>We use first-party session cookies for authentication (NextAuth session cookie). We use localStorage to remember your email (Remember Me) and to persist drafts in our study tools.</p>
      <p>We do not use third-party tracking cookies, analytics, or advertising cookies.</p>

      <h2>7. Data Retention</h2>
      <p>We retain student data for the duration of the active subscription plus 90 days. Upon request, we will delete all user data within 30 days. Anonymized, aggregated data may be retained indefinitely for research and improvement purposes.</p>

      <h2>8. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of your data — Students and Parents can request account deletion by emailing privacy@limud.co; District ADMINs can also process deletion requests through the District Admin Console. See our <a href="/api/security/data-deletion">Data Deletion API</a> docs.</li>
        <li>Export your data in a portable format</li>
        <li>Opt out of non-essential communications</li>
      </ul>

      <h2>8a. California and State Privacy Rights</h2>
      <p>If you are a resident of California, Virginia, Colorado, Connecticut, Utah, or Texas, you have additional rights under your state&apos;s privacy law:</p>
      <ul>
        <li><strong>California (CCPA/CPRA)</strong></li>
        <li><strong>Virginia (VCDPA)</strong></li>
        <li><strong>Colorado (CPA)</strong></li>
        <li><strong>Connecticut (CTDPA)</strong></li>
        <li><strong>Utah (UCPA)</strong></li>
        <li><strong>Texas (TDPSA)</strong></li>
      </ul>
      <p>Depending on your state, these rights include the right to: <strong>Know</strong> what personal data we collect, <strong>Access</strong> a copy of it, <strong>Delete</strong> it, <strong>Correct</strong> inaccuracies, <strong>Limit</strong> the use of sensitive personal information, <strong>Portability</strong> of your data in a usable format, and <strong>Opt out of the sale</strong> of personal information.</p>
      <p>Limud does not sell personal information. To exercise any of these rights, contact us at <strong>privacy@limud.co</strong>.</p>

      <h2>9. Contact Us</h2>
      <p>If you have questions about this Privacy Policy or wish to exercise your data rights, contact us at:</p>
      <p>
        <strong>Limud Education Inc.</strong><br />
        Email: privacy@limud.co<br />
        Address: [registered address pending — contact privacy@limud.co for our registered office]
      </p>
    </article>
  );
}
