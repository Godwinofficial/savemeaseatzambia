import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  PAYMENT_PHONE_NUMBER,
  PAYMENT_PHONE_RAW,
  PAYMENT_ACCOUNT_NAME,
  PAYMENT_MOBILE_NETWORK,
  formatKwacha
} from '../utils/pricing';
import './RsvpLockedGate.css';

/**
 * Shown in place of the RSVP form while an invitation is awaiting
 * payment / approval. Deliberately minimal: text only, no icons or emojis.
 */
const RsvpLockedGate = ({ weddingData = {} }) => {
  const [copied, setCopied] = useState(false);

  const groomName = weddingData.couple?.groom?.name || weddingData.groom_name || 'Groom';
  const brideName = weddingData.couple?.bride?.name || weddingData.bride_name || 'Bride';
  const slug = weddingData.slug || weddingData.id || 'wedding';
  const price = weddingData.balance_due ?? weddingData.price ?? 550;
  const formattedPrice = formatKwacha(price);

  const copyPaymentNumber = () => {
    navigator.clipboard.writeText(PAYMENT_PHONE_RAW);
    setCopied(true);
    toast.success('Number copied: ' + PAYMENT_PHONE_RAW);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `Hello SaveMeASeat Zambia! I would like to activate RSVP for our wedding invitation.\n\n` +
    `Couple: ${groomName} & ${brideName}\n` +
    `Event Link: ${window.location.origin}/w/${slug}\n` +
    `Amount: ${formattedPrice}`
  );
  const whatsappUrl = `https://wa.me/260972037996?text=${whatsappMessage}`;

  return (
    <div className="rlg">
      <p className="rlg-eyebrow">RSVP not yet open</p>

      <h3 className="rlg-title">Activate your invitation to start receiving RSVPs</h3>

      <p className="rlg-desc">
        Your invitation is ready to preview. Once payment of{' '}
        <strong>{formattedPrice}</strong> is confirmed, this space becomes the
        RSVP form and guests receive their admission cards automatically.
      </p>

      <div className="rlg-divider" />

      <dl className="rlg-details">
        <div className="rlg-row">
          <dt>Amount</dt>
          <dd>{formattedPrice}</dd>
        </div>
        <div className="rlg-row">
          <dt>Mobile money</dt>
          <dd className="rlg-number">
            <span>{PAYMENT_PHONE_NUMBER}</span>
            <button
              type="button"
              id="rsvp-gate-copy-number"
              className={`rlg-copy ${copied ? 'is-copied' : ''}`}
              onClick={copyPaymentNumber}
            >
              {copied ? 'Copied' : 'Copy'}
            </button>
          </dd>
        </div>
        <div className="rlg-row">
          <dt>Network</dt>
          <dd>{PAYMENT_MOBILE_NETWORK}</dd>
        </div>
        <div className="rlg-row">
          <dt>Account name</dt>
          <dd>{PAYMENT_ACCOUNT_NAME}</dd>
        </div>
        <div className="rlg-row">
          <dt>Reference</dt>
          <dd className="rlg-mono">{slug}</dd>
        </div>
      </dl>

      <ol className="rlg-steps">
        <li>Send {formattedPrice} to the number above using the reference.</li>
        <li>Share your payment confirmation with us on WhatsApp.</li>
        <li>We verify it and the RSVP form opens right here.</li>
      </ol>

      <a
        href={whatsappUrl}
        id="rsvp-gate-whatsapp"
        target="_blank"
        rel="noopener noreferrer"
        className="rlg-btn"
      >
        Send confirmation on WhatsApp
      </a>

      <p className="rlg-note">Usually activated within minutes during business hours.</p>
    </div>
  );
};

export default RsvpLockedGate;
