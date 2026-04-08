export default function AccessibilityStatement() {
  return (
    <article className="prose prose-gray max-w-none">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Accessibility Statement</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: February 25, 2026</p>

      <p>Limud Education Inc. is committed to ensuring digital accessibility for people of all abilities. We continually improve the user experience for everyone and apply relevant accessibility standards.</p>

      <h2>Our Commitment</h2>
      <p>Limud strives to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. These guidelines explain how to make web content more accessible to people with disabilities and more user-friendly for everyone.</p>

      <h2>Accessibility Features</h2>
      <h3>Visual Accessibility</h3>
      <ul>
        <li><strong>High Contrast Mode:</strong> Toggle high contrast colors for improved visibility</li>
        <li><strong>Text Resizing:</strong> All text can be resized up to 200% without loss of functionality</li>
        <li><strong>Dark Mode:</strong> Full dark mode support to reduce eye strain</li>
        <li><strong>Color Independence:</strong> Information is not conveyed by color alone</li>
      </ul>

      <h3>Reading Accessibility</h3>
      <ul>
        <li><strong>Dyslexia Font:</strong> OpenDyslexic font option for users with dyslexia</li>
        <li><strong>Adjustable Line Spacing:</strong> Customize line height and letter spacing</li>
        <li><strong>Reading Guides:</strong> Visual guides to help track reading position</li>
      </ul>

      <h3>Motor Accessibility</h3>
      <ul>
        <li><strong>Keyboard Navigation:</strong> All features are accessible via keyboard</li>
        <li><strong>Focus Indicators:</strong> Clear, visible focus indicators on all interactive elements</li>
        <li><strong>Skip Navigation:</strong> Skip-to-content links on all pages</li>
        <li><strong>Large Click Targets:</strong> Minimum 44x44 pixel touch targets</li>
      </ul>

      <h3>Cognitive Accessibility</h3>
      <ul>
        <li><strong>Reduced Motion:</strong> Respects prefers-reduced-motion system setting</li>
        <li><strong>Clear Navigation:</strong> Consistent layout and navigation patterns</li>
        <li><strong>Plain Language:</strong> AI tutor adapts language to the student&apos;s grade level</li>
        <li><strong>Error Prevention:</strong> Clear error messages and confirmation dialogs</li>
      </ul>

      <h2>Technical Standards</h2>
      <ul>
        <li>Semantic HTML5 throughout the application</li>
        <li>ARIA labels on all interactive components</li>
        <li>Proper heading hierarchy (h1-h6)</li>
        <li>Alt text on all meaningful images</li>
        <li>Form labels associated with all inputs</li>
        <li>Sufficient color contrast ratios (4.5:1 for normal text, 3:1 for large text)</li>
      </ul>

      <h2>Known Limitations</h2>
      <p>While we strive for complete accessibility, some areas are actively being improved:</p>
      <ul>
        <li>Some complex data visualizations in analytics may not be fully accessible to screen readers (text alternatives provided)</li>
        <li>Third-party embedded content may have varying levels of accessibility</li>
      </ul>

      <h2>Feedback & Support</h2>
      <p>If you encounter any accessibility barriers on Limud, please let us know:</p>
      <ul>
        <li>Email: accessibility@limud.edu</li>
        <li>Phone: (555) 123-4567</li>
        <li>In-app: Use the Accessibility button in your dashboard sidebar</li>
      </ul>
      <p>We aim to respond to accessibility feedback within 2 business days.</p>
    </article>
  );
}
