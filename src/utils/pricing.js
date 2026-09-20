/**
 * pricing.js
 * Guest-based pricing logic for SaveMeASeat Zambia (ZMW).
 * 
 * Tiers:
 * - Up to 100 guests: K550
 * - Up to 250 guests: K650
 * - Up to 400 guests: K750
 * - Over 400 guests:  K1,000
 */

export const PRICING_TIERS = [
    {
        id: 'tier_100',
        maxGuests: 100,
        label: 'Up to 100 guests',
        price: 550,
        formattedPrice: 'K550',
        badge: 'Intimate / Small'
    },
    {
        id: 'tier_250',
        maxGuests: 250,
        label: 'Up to 250 guests',
        price: 650,
        formattedPrice: 'K650',
        badge: 'Most Popular'
    },
    {
        id: 'tier_400',
        maxGuests: 400,
        label: 'Up to 400 guests',
        price: 750,
        formattedPrice: 'K750',
        badge: 'Large Celebration'
    },
    {
        id: 'tier_over_400',
        maxGuests: Infinity,
        label: 'Over 400 guests',
        price: 1000,
        formattedPrice: 'K1,000',
        badge: 'Grand Gala'
    }
];

export const PAYMENT_PHONE_NUMBER = '+260 960 968 349';
export const PAYMENT_PHONE_RAW = '260960968349';
export const PAYMENT_PHONE = PAYMENT_PHONE_NUMBER;
export const WHATSAPP_PHONE = PAYMENT_PHONE_RAW;
export const PAYMENT_ACCOUNT_NAME = 'Godwin Banda';
export const PAYMENT_MOBILE_NETWORK = 'Airtel Money';
export const PAYMENT_BANK_NAME = 'First National Bank (FNB)';
export const PAYMENT_BANK_ACCOUNT = '63149798184';
export const PAYMENT_BANK_BRANCH = 'Lusaka Main';

/**
 * Format pricing tier for display
 * @param {string} tier
 * @returns {string}
 */
export function formatPricingTier(tier) {
    if (!tier) return 'Up to 100 guests';
    const s = String(tier);
    if (s.includes('Tier 1') || s === 'tier_100') return 'Up to 100 guests';
    if (s.includes('Tier 2') || s === 'tier_250') return 'Up to 250 guests';
    if (s.includes('Tier 3') || s === 'tier_400') return 'Up to 400 guests';
    if (s.includes('Tier 4') || s === 'tier_over_400') return 'Over 400 guests';
    return s;
}

/**
 * Calculate pricing information from expected guest count.
 * @param {number|string} guestCount 
 * @returns {{ price: number, tier: string, formattedPrice: string, maxGuests: number, tierId: string }}
 */
export function calculatePricing(guestCount) {
    const count = parseInt(guestCount, 10);
    const validCount = isNaN(count) || count < 1 ? 100 : count;

    for (const tier of PRICING_TIERS) {
        if (validCount <= tier.maxGuests) {
            return {
                price: tier.price,
                tier: tier.label,
                formattedPrice: tier.formattedPrice,
                maxGuests: tier.maxGuests,
                tierId: tier.id,
                badge: tier.badge
            };
        }
    }

    const lastTier = PRICING_TIERS[PRICING_TIERS.length - 1];
    return {
        price: lastTier.price,
        tier: lastTier.label,
        formattedPrice: lastTier.formattedPrice,
        maxGuests: lastTier.maxGuests,
        tierId: lastTier.id,
        badge: lastTier.badge
    };
}

/**
 * Format a number as Kwacha.
 * @param {number} amount 
 * @returns {string} e.g. "K650" or "K1,000"
 */
export function formatKwacha(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return 'K550';
    return `K${Number(amount).toLocaleString('en-US')}`;
}

/**
 * Calculate balance due given a current price and previous amount paid.
 * @param {number} newPrice 
 * @param {number} amountPaid 
 * @returns {number}
 */
export function calculateBalanceDue(newPrice, amountPaid = 0) {
    const p = Number(newPrice) || 0;
    const paid = Number(amountPaid) || 0;
    return Math.max(0, p - paid);
}
