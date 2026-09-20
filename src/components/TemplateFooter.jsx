import React from 'react';

const TemplateFooter = () => {
  const isPreviewMode =
    new URLSearchParams(window.location.search).get('preview') === 'true' ||
    new URLSearchParams(window.location.search).get('theme_preview') === 'true';

  if (isPreviewMode) return null;

  return (
    <section
      style={{
        padding: '35px 20px 60px 20px',
        background: '#fdfbf7',
        textAlign: 'center',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h3
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1.25rem',
          color: '#1a1a1a',
          marginBottom: '6px',
          fontWeight: 600,
        }}
      >
        Want to create your own wedding invitation?
      </h3>
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '0.9rem',
          color: 'rgba(26, 26, 26, 0.6)',
          marginBottom: '20px',
        }}
      >
        Design a beautiful, shareable invitation in minutes.
      </p>
      <a
        href="/create-event"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          padding: '10px 24px',
          background: '#1fa09b',
          color: '#fff',
          textDecoration: 'none',
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '1rem',
          borderRadius: '4px',
          transition: 'opacity 0.3s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
        onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
      >
        Create Your Invitation
      </a>
      <div
        style={{
          marginTop: '16px',
          fontSize: '0.75rem',
          color: 'rgba(26, 26, 26, 0.4)',
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Made with SaveMeASeat
      </div>
    </section>
  );
};

export default TemplateFooter;
