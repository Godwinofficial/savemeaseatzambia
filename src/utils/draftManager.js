/**
 * draftManager.js
 * Manages localStorage persistence for the guest-first event creation flow.
 * Draft survives page refreshes, auth redirects, and OAuth callbacks.
 */

import { supabase } from '../supabaseClient';
import { calculatePricing } from './pricing';

/**
 * Generate a unique, human-readable Event ID.
 * Format: EVT- followed by 8 random uppercase alphanumeric characters.
 * Example: EVT-8F3K2A7B
 * @returns {string}
 */
export function generateEventId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/1/I to avoid confusion
    let result = 'EVT-';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export const DRAFT_KEY = 'savemeaseat_event_draft';
export const DRAFT_META_KEY = 'savemeaseat_event_draft_meta';

/**
 * Save the full form data to localStorage.
 * @param {Object} formData - The current form state object
 */
export function saveDraft(formData) {
    try {
        const meta = {
            savedAt: new Date().toISOString(),
            version: 1,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        localStorage.setItem(DRAFT_META_KEY, JSON.stringify(meta));
    } catch (err) {
        console.warn('[draftManager] Failed to save draft:', err);
    }
}

/**
 * Load draft from localStorage.
 * @returns {{ formData: Object, meta: Object } | null} The saved draft or null
 */
export function loadDraft() {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        const metaRaw = localStorage.getItem(DRAFT_META_KEY);

        if (!raw) return null;

        const formData = JSON.parse(raw);
        const meta = metaRaw ? JSON.parse(metaRaw) : {};

        // Basic validation: must have at least a name or date to be meaningful
        if (!formData || typeof formData !== 'object') return null;

        return { formData, meta };
    } catch (err) {
        console.warn('[draftManager] Failed to load draft:', err);
        return null;
    }
}

/**
 * Check if a draft exists.
 * @returns {boolean}
 */
export function hasDraft() {
    return !!localStorage.getItem(DRAFT_KEY);
}

/**
 * Clear the draft from localStorage.
 */
export function clearDraft() {
    try {
        localStorage.removeItem(DRAFT_KEY);
        localStorage.removeItem(DRAFT_META_KEY);
    } catch (err) {
        console.warn('[draftManager] Failed to clear draft:', err);
    }
}

/**
 * Check if a draft is meaningful (has at least some data).
 * @returns {boolean}
 */
export function isDraftMeaningful() {
    const draft = loadDraft();
    if (!draft) return false;
    const { formData } = draft;
    return !!(
        formData.groom_name?.trim() ||
        formData.bride_name?.trim() ||
        formData.date ||
        formData.ceremony_venue?.trim()
    );
}

/**
 * Get a human-readable "last saved" string.
 * @returns {string | null}
 */
export function getDraftAge() {
    try {
        const metaRaw = localStorage.getItem(DRAFT_META_KEY);
        if (!metaRaw) return null;
        const meta = JSON.parse(metaRaw);
        if (!meta.savedAt) return null;
        const saved = new Date(meta.savedAt);
        const diff = Math.floor((Date.now() - saved.getTime()) / 1000);
        if (diff < 60) return 'just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
        return saved.toLocaleDateString();
    } catch {
        return null;
    }
}

/**
 * Automatically push the local draft to Supabase under the user's account.
 * Clears the draft from localStorage upon successful insertion.
 * 
 * @param {Object} user - Supabase Auth user object ({ id, ... })
 * @param {Object} [customFormData] - Optional explicit form data, defaults to loadDraft()
 * @returns {Promise<{ success: boolean, event?: Object, slug?: string, error?: any }>}
 */
export async function pushDraftToUserAccount(user, customFormData = null) {
    if (!user || !user.id) {
        console.warn('[draftManager] pushDraftToUserAccount: No user or user.id provided');
        return { success: false, reason: 'No user provided' };
    }

    const draft = customFormData ? { formData: customFormData } : loadDraft();
    if (!draft || !draft.formData) {
        return { success: false, reason: 'No draft found' };
    }

    const data = draft.formData;
    // Check if draft has actual data
    if (!data.groom_name?.trim() && !data.bride_name?.trim() && !data.date && !data.ceremony_venue?.trim()) {
        return { success: false, reason: 'Draft is empty' };
    }

    try {
        const cg = (data.groom_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const cb = (data.bride_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const cd = (data.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9]+/g, '-');
        const slug = `${cg || 'wedding'}-${cb || 'celebration'}-${cd}-${Date.now().toString().slice(-6)}`;

        const pricing = calculatePricing(data.guest_count || 100);

        const payload = {
            event_id: data.event_id || generateEventId(),
            groom_name: data.groom_name?.trim() || '',
            bride_name: data.bride_name?.trim() || '',
            groom_image: data.groom_image || '',
            bride_image: data.bride_image || '',
            groom_description: data.groom_description || '',
            bride_description: data.bride_description || '',
            tagline: data.tagline?.trim() || 'We are getting married',
            cover_image: data.cover_image || '',
            date: data.date || null,
            location: data.location || '',
            ceremony_date: data.ceremony_date || data.date || null,
            ceremony_time: data.ceremony_time || null,
            ceremony_venue: data.ceremony_venue || '',
            reception_date: data.reception_date || data.date || null,
            reception_time: data.reception_time || null,
            reception_venue: data.reception_venue || '',
            reception_address: data.reception_address || '',
            venue_name: data.venue_name || data.ceremony_venue || '',
            venue_address: data.venue_address || data.ceremony_address || '',
            venue_description: data.venue_description || (data.extra_card_text ? `EXTRA_CARD_TEXT:${data.extra_card_text}` : ''),
            map_location: data.map_location || '',
            rsvp_deadline: data.rsvp_deadline || null,
            story_part1: data.story_part1 || '',
            story_highlight: data.story_highlight || '',
            story_part2: data.story_part2 || '',
            dress_code: data.dress_code || '',
            dress_code_desc: data.dress_code_desc || '',
            template_id: data.template_id || 1,
            slider_images: data.slider_images || [],
            gallery_images: data.gallery_images || [],
            bridesmaids: data.bridesmaids || [],
            groomsmen: data.groomsmen || [],
            gifts: data.gifts || [],
            allowed_guests: data.allowed_guests || ['1', '2'],
            theme_colors: data.theme_colors || [],
            dress_code_colors: data.dress_code_colors || [],
            extra_card_text: data.extra_card_text || '',
            music_url: data.music_url || '',
            hero_video_url: data.hero_video_url || '',
            reception_title: data.reception_title || 'RECEPTION',
            reception_subtitle: data.reception_subtitle || 'Party',
            show_gallery_titles: data.show_gallery_titles !== false,
            guest_count: parseInt(data.guest_count, 10) || 100,
            price: pricing.price,
            pricing_tier: pricing.tier,
            amount_paid: 0,
            balance_due: pricing.price,
            slug,
            user_id: user.id,
            status: 'pending',
        };

        let { data: inserted, error: insertError } = await supabase
            .from('weddings')
            .insert([payload])
            .select()
            .single();

        if (insertError) {
            console.warn('[draftManager] Extended insert failed, attempting fallback with base columns:', insertError.message);
            // Strip newly added columns in case migrations haven't run yet in Supabase
            const { event_id, guest_count, price, pricing_tier, amount_paid, balance_due, ...basePayload } = payload;
            const fallback = await supabase
                .from('weddings')
                .insert([basePayload])
                .select()
                .single();

            if (fallback.error) {
                console.error('[draftManager] Failed to insert draft into weddings:', fallback.error);
                return { success: false, error: fallback.error };
            }
            inserted = fallback.data;
        }

        console.log('[draftManager] Successfully pushed draft to user account:', inserted.slug);
        clearDraft();
        return { success: true, event: inserted, slug };
    } catch (err) {
        console.error('[draftManager] Exception in pushDraftToUserAccount:', err);
        return { success: false, error: err };
    }
}
