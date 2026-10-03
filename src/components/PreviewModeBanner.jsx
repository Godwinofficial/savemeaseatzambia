import React, { useState } from 'react';
import './PreviewModeBanner.css';

const PreviewModeBanner = ({ weddingData = {} }) => {
  const [collapsed, setCollapsed] = useState(false);
  const slug = weddingData.slug || weddingData.id || '';

  const whatsappUrl = `https://wa.me/260972037996?text=${encodeURIComponent(
    `Hi SaveMeASeat Zambia, I would like to activate my wedding invitation (${slug})`
  )}`;

  if (collapsed) {
    return (
      <button
        type="button"
        id="preview-banner-expand"
        className="pmb-collapsed-pill"
        onClick={() => setCollapsed(false)}
        aria-label="Show preview mode details"
      >
        <span className="pmb-dot" />
        Preview Mode
      </button>
    );
  }

  return (
    <div className="pmb-bar" role="status">
      <div className="pmb-inner">
        <div className="pmb-left">
          <span className="pmb-badge">
            <span className="pmb-dot" />
            Preview Mode
          </span>
          <p className="pmb-text">
            <strong>This invitation is not live yet.</strong>
            <span className="pmb-text-sub"> Guests can view everything, but RSVP unlocks after payment.</span>
          </p>
        </div>

        <div className="pmb-actions">
          <a href="#rsvp" id="preview-banner-rsvp" className="pmb-btn pmb-btn-ghost">
            <i className="fas fa-lock" />
            <span>RSVP Locked</span>
          </a>
          <a
            href={whatsappUrl}
            id="preview-banner-activate"
            target="_blank"
            rel="noopener noreferrer"
            className="pmb-btn pmb-btn-primary"
          >
            <i className="fas fa-bolt" />
            <span>Activate Now</span>
          </a>
          <button
            type="button"
            id="preview-banner-close"
            className="pmb-close"
            onClick={() => setCollapsed(true)}
            aria-label="Minimise preview banner"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewModeBanner;
