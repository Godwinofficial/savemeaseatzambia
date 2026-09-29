/**
 * AI Wedding Parser Utility for SaveMeASeat
 * Extracts structured wedding event data from unstructured text (e.g., WhatsApp invites,
 * card transcripts, emails, or bullet points) and maps it to the AddWedding formData schema.
 */

import { GROQ_URL, GROQ_MODEL, FALLBACK_MODELS } from '../lib/aiKnowledge.js';

export const SAMPLE_WEDDING_PROMPTS = [
  {
    label: "Zambian Cathedral & Garden Wedding (Lusaka)",
    text: `Save The Date!
We, Chileshe Mwape & Kondwani Phiri, joyfully invite you to celebrate our Holy Matrimony.
Date: Saturday, 14th November 2026
Location: Lusaka, Zambia

Church Service:
Venue: Cathedral of the Child Jesus, Fairley Road, Lusaka
Time: 09:30 AM to 12:00 PM

Evening Reception:
Venue: Urban Hotel Gardens, Plot 4972 Los Angeles Blvd, Longacres, Lusaka
Time: 15:00 (3:00 PM) till late

Theme & Dress Code:
Dress Code: Formal Elegance with a touch of Emerald Green and Champagne Gold.
Colors: Emerald Green, Champagne Gold, Pure White, Charcoal Black.

Bridal Party:
Best Man: Mwamba Phiri
Maid of Honor: Natasha Mwape
Groomsmen: Daliso Phiri, Kelvin Musonda, Bwalya Chanda
Bridesmaids: Thandiwe Banda, Bupe Mwape, Lisa Tembo

Program Schedule:
09:00 AM - Guest Arrival at Cathedral
09:30 AM - Holy Matrimony Ceremony
12:30 PM - Photoshoot & Bridal Luncheon
15:00 PM - Reception Cocktail & Seating
16:00 PM - Grand Entrance & Dinner
18:30 PM - Cake Cutting & First Dance
20:00 PM - Evening Party & Toasts

RSVP by 20th October 2026 via SaveMeASeat portal.
Gift Registry / Contributions:
Cash & Mobile Money gifts are warmly welcomed:
- Airtel Money: 0977 123456 (Kondwani Phiri)
- MTN Mobile Money: 0966 654321 (Chileshe Mwape)

Our Story:
We met during our university days in 2020 at a campus charity gala and quickly became inseparable. Under a starlit sky at Victoria Falls in Livingstone, Kondwani dropped to one knee and asked the forever question.`
  },
  {
    label: "Ndola Modern Classic Wedding",
    text: `Wedding Invitation:
Join Mutale Bwalya and Joshua Tembo as they tie the knot!
Date: 5th December 2026 in Ndola.
Ceremony at St. Andrew's United Church, Broadway Ave, Ndola at 10:00 AM.
Reception at Michelangelo Hotel Ballroom at 4:00 PM.
Dress Code: Black Tie / Navy Blue & Silver Glamour.
RSVP Deadline: November 15, 2026.
Best Man: Patrick Tembo, Maid of Honor: Kasonde Bwalya.
Gifts: Mobile Money 0979 888777 (Joshua Tembo).`
  },
  {
    label: "Quick WhatsApp Message",
    text: `Hey family & friends! Alice & Brian are getting married on 18 Oct 2026 in Kitwe!
Ceremony: 10am at Christ the King Parish.
Reception: 2:30pm at Garden Court Hotel Kitwe.
Colors: Burgundy & Blush Pink.
RSVP deadline: end of September.
Send gifts to Brian on Airtel 0978001122.`
  }
];

// Helper: Normalize date to YYYY-MM-DD
export function normalizeDate(str) {
  if (!str) return "";
  const trimmed = String(str).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const parsed = Date.parse(trimmed);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Handle formats like "14th November 2026", "18 Oct 2026", "October 18 2026"
  const monthNames = {
    jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03',
    apr: '04', april: '04', may: '05', june: '06', jun: '06', jul: '07', july: '07',
    aug: '08', august: '08', sep: '09', sept: '09', september: '09', oct: '10', october: '10',
    nov: '11', november: '11', dec: '12', december: '12'
  };

  const regex1 = /(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s*,?\s*(\d{4})/;
  const m1 = trimmed.match(regex1);
  if (m1) {
    const day = String(m1[1]).padStart(2, '0');
    const mKey = m1[2].toLowerCase().slice(0, 3);
    const month = monthNames[mKey] || monthNames[m1[2].toLowerCase()];
    const year = m1[3];
    if (month) return `${year}-${month}-${day}`;
  }

  const regex2 = /([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?\s*,?\s*(\d{4})/;
  const m2 = trimmed.match(regex2);
  if (m2) {
    const mKey = m2[1].toLowerCase().slice(0, 3);
    const month = monthNames[mKey] || monthNames[m2[1].toLowerCase()];
    const day = String(m2[2]).padStart(2, '0');
    const year = m2[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return "";
}

// Helper: Normalize time to "HH:mm" or "hh:mm AM/PM"
export function normalizeTime(str) {
  if (!str) return "";
  const trimmed = String(str).trim();
  const timeMatch = trimmed.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const minutes = timeMatch[2];
    const ampm = timeMatch[3] ? timeMatch[3].toUpperCase() : null;

    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;

    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  // Handle e.g. "10am", "2:30pm", "3pm"
  const colonMatch = trimmed.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (colonMatch) {
    let hours = parseInt(colonMatch[1], 10);
    const minutes = colonMatch[2];
    const ampm = colonMatch[3] ? colonMatch[3].toUpperCase() : null;
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const shortMatch = trimmed.match(/(\d{1,2})\s*(am|pm)/i);
  if (shortMatch) {
    let hours = parseInt(shortMatch[1], 10);
    const ampm = shortMatch[2].toUpperCase();
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:00`;
  }

  return trimmed;
}

// Helper: Format Event Location using Reception / Luncheon venue
// Requirement: "SEE IN LOCATION DONT PUT LUSAKA PUT RECEPTION/LUNCHEON VENUE Lusaka, Zambia"
export function formatEventLocation(receptionVenue, rawLocation) {
  const venue = (receptionVenue || "").trim();
  const loc = (rawLocation || "").trim();

  if (!venue) return loc;
  if (!loc) return venue;

  // If venue already includes the full location string (e.g. "Radisson Blu Hotel, Lusaka, Zambia")
  if (venue.toLowerCase().includes(loc.toLowerCase())) {
    return venue;
  }

  // Parse city and country from loc (e.g. "Lusaka, Zambia")
  const parts = loc.split(/,\s*/);
  const city = parts[0] || "";
  const country = parts[1] || "";

  // If venue already contains the city name (e.g. "Radisson Blu Hotel Lusaka")
  if (city && venue.toLowerCase().includes(city.toLowerCase())) {
    return country ? `${venue}, ${country}` : venue;
  }

  return `${venue}, ${loc}`;
}

/**
 * High-precision local heuristic / NLP rule-based parser.
 * Works completely offline without needing an active API key.
 * Follows the user rule: Skip all images, and if something is not mentioned, leave it blank ("").
 */
export function parseWeddingWithLocalRules(text) {
  const result = {
    // 1. The Couple
    bride_name: "",
    bride_description: "",
    bride_image: "", // Explicitly skipped (user adds manually)
    groom_name: "",
    groom_description: "",
    groom_image: "", // Explicitly skipped (user adds manually)
    cover_image: "", // Explicitly skipped (user adds manually)
    tagline: "We are getting married",

    // 2. Template (1: Default Elegance, 2: Golden Romance, 3: Botanical Olive, 4: Terracotta Earth, 5: Tropical Elegance, 6: Modern Classic)
    template_id: 1,

    // 3. Main Event Details
    date: "",
    location: "",
    rsvp_deadline: "",
    dress_code: "",
    dress_code_desc: "",
    extra_card_text: "",

    // 4. Website Theme Colors (1st: Accent, 2nd: Background, 3rd: Card Bg, 4th: Text)
    theme_colors: ['#1FA09B', '#0F172A', '#1E293B', '#FFFFFF'],
    // Guest Dress Code Colors
    dress_code_colors: [],

    // 5. Maximum Guests Per RSVP
    allowed_guests: ["1", "2"],

    // 6. Venue Location
    venue_name: "",
    venue_address: "",
    venue_description: "",

    // 7. Ceremony Details
    ceremony_title: "Holy Matrimony",
    ceremony_subtitle: "",
    ceremony_venue: "",
    ceremony_date: "",
    ceremony_time: "",

    // 8. Reception Details
    reception_title: "Wedding Reception",
    reception_subtitle: "",
    reception_venue: "",
    reception_date: "",
    reception_time: "",
    reception_address: "",

    // 9. Church Service & Wedding Program
    program: [],

    // 10. Our Story (Leave blank if not provided)
    story_part1: "",
    story_highlight: "",
    story_part2: "",

    // 11. Photos & Wedding Party
    bridesmaids: [],
    groomsmen: [],
    gifts: [],
    gallery_images: [], // Explicitly skipped
    slider_images: [],  // Explicitly skipped
  };

  // ==========================================
  // PASS 1: STRUCTURED KEY-VALUE / MARKDOWN PARSING
  // ==========================================

  // Groom (strict: only match section headings like "## The Groom" or "# The Groom", not random "The Groom" in prose)
  const groomBlock = text.match(/(?:^##?\s*The Groom\b|\bThe Groom\b\s*\n)[\s\S]*?(?=(?:The Bride|##\s*The Bride|#\s*The Bride|$))/im);
  if (groomBlock) {
    const gb = groomBlock[0];
    const nameM = gb.match(/\*\*Full Name\*\*\s*[\r\n]+([^\r\n*#]+)/i) ||
                  gb.match(/Full Name[:\s]*[\r\n]+([^\r\n*#]+)/i);
    if (nameM) result.groom_name = nameM[1].trim();

    const descM = gb.match(/\*\*(?:Bio & Description|Description|Bio)\*\*\s*[\r\n]+([\s\S]*?)(?=(?:---|##|#|\*\*|$))/i) ||
                  gb.match(/(?:Bio & Description|Description|Bio)[:\s]*[\r\n]+([\s\S]*?)(?=(?:---|##|#|\*\*|$))/i);
    if (descM) result.groom_description = descM[1].trim();
  }

  // Bride (strict: only match section headings)
  const brideBlock = text.match(/(?:^##?\s*The Bride\b|\bThe Bride\b\s*\n)[\s\S]*?(?=(?:Page Tagline|##\s*Page Tagline|#|$))/im);
  if (brideBlock) {
    const bb = brideBlock[0];
    const nameM = bb.match(/\*\*Full Name\*\*\s*[\r\n]+([^\r\n*#]+)/i) ||
                  bb.match(/Full Name[:\s]*[\r\n]+([^\r\n*#]+)/i);
    if (nameM) result.bride_name = nameM[1].trim();

    const descM = bb.match(/\*\*(?:Bio & Description|Description|Bio)\*\*\s*[\r\n]+([\s\S]*?)(?=(?:---|##|#|\*\*|$))/i) ||
                  bb.match(/(?:Bio & Description|Description|Bio)[:\s]*[\r\n]+([\s\S]*?)(?=(?:---|##|#|\*\*|$))/i);
    if (descM) result.bride_description = descM[1].trim();
  }

  // Title fallback "# Mike & Mary Wedding"
  if (!result.bride_name || !result.groom_name) {
    const titleMatch = text.match(/#\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*(?:&|and)\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s*Wedding/i);
    if (titleMatch) {
      if (!result.groom_name) result.groom_name = titleMatch[1].trim();
      if (!result.bride_name) result.bride_name = titleMatch[2].trim();
    }
  }

  // Tagline
  const taglineM = text.match(/(?:Page Tagline|##\s*Page Tagline)[\s\S]*?\*\*([^\n\r*]+)\*\*/i) ||
                   text.match(/(?:Page Tagline|##\s*Page Tagline)[:\s]*[\r\n]+([^\r\n*#]+)/i);
  if (taglineM) result.tagline = taglineM[1].trim();

  // Template ID
  if (/modern\s*classic/i.test(text)) result.template_id = 6;
  else if (/golden\s*romance/i.test(text)) result.template_id = 2;
  else if (/botanical\s*olive/i.test(text)) result.template_id = 3;
  else if (/terracotta\s*earth/i.test(text)) result.template_id = 4;
  else if (/tropical\s*elegance/i.test(text)) result.template_id = 5;
  else if (/default\s*elegance/i.test(text)) result.template_id = 1;

  // Main Event Date
  const weddingDateM = text.match(/\*\*Wedding Date\*\*\s*[\r\n]+([^\r\n*#]+)/i);
  if (weddingDateM) {
    const cleanD = normalizeDate(weddingDateM[1]);
    if (cleanD) {
      result.date = cleanD;
      result.ceremony_date = cleanD;
      result.reception_date = cleanD;
    }
  }

  // Location
  const locationM = text.match(/\*\*Location\*\*\s*[\r\n]+([^\r\n*#]+)/i);
  if (locationM) result.location = locationM[1].trim();

  // RSVP Deadline
  const rsvpM = text.match(/\*\*RSVP Deadline\*\*\s*[\r\n]+([^\r\n*#]+)/i);
  if (rsvpM) {
    const cleanR = normalizeDate(rsvpM[1]);
    if (cleanR) result.rsvp_deadline = cleanR;
  }

  // Dress Code
  const dressM = text.match(/\*\*Dress Code\*\*\s*[\r\n]+([^\r\n*#]+)/i);
  if (dressM) {
    result.dress_code = dressM[1].trim();
    result.dress_code_desc = `Please dress in ${dressM[1].trim()}`;
  }

  // Pass Card Extra Text
  const passM = text.match(/\*\*Pass Card Extra Text\*\*\s*[\r\n]+([^\r\n*#]+)/i);
  if (passM) result.extra_card_text = passM[1].trim();

  // Theme Colors
  const accentM = text.match(/\*\*Accent\*\*\s*[\r\n]+(#?[A-Fa-f0-9]{6})/i);
  const bgM = text.match(/\*\*Background\*\*\s*[\r\n]+(#?[A-Fa-f0-9]{6})/i);
  const cardBgM = text.match(/\*\*Card Bg\*\*\s*[\r\n]+(#?[A-Fa-f0-9]{6})/i);
  const textColM = text.match(/\*\*Text\*\*\s*[\r\n]+(#?[A-Fa-f0-9]{6})/i);

  if (accentM || bgM || cardBgM || textColM) {
    result.theme_colors = [
      accentM ? (accentM[1].startsWith('#') ? accentM[1] : '#' + accentM[1]) : '#8B5E83',
      bgM ? (bgM[1].startsWith('#') ? bgM[1] : '#' + bgM[1]) : '#F8F5F2',
      cardBgM ? (cardBgM[1].startsWith('#') ? cardBgM[1] : '#' + cardBgM[1]) : '#FFFFFF',
      textColM ? (textColM[1].startsWith('#') ? textColM[1] : '#' + textColM[1]) : '#2B2528'
    ];
  }

  // Guest Dress Code Colors
  const guestColorsBlock = text.match(/(?:#\s*Guest Dress Code Colors|Guest Dress Code Colors)[\s\S]*?(?=(?:#\s*Maximum|#\s*Venue|#\s*Ceremony|$))/i);
  if (guestColorsBlock) {
    const hexMatches = guestColorsBlock[0].match(/#[A-Fa-f0-9]{6}/g);
    if (hexMatches && hexMatches.length > 0) {
      result.dress_code_colors = hexMatches;
    }
  }

  // Ceremony Details
  const ceremonyBlock = text.match(/(?:#\s*Ceremony Details|##\s*Ceremony Details)[\s\S]*?(?=(?:---|#\s*Reception Details|$))/i);
  if (ceremonyBlock) {
    const cb = ceremonyBlock[0];
    const titleM = cb.match(/\*\*Section Title\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (titleM) result.ceremony_title = titleM[1].trim();

    const subM = cb.match(/\*\*Section Subheading\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (subM) result.ceremony_subtitle = subM[1].trim();

    const venueM = cb.match(/\*\*Venue Name\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (venueM) {
      result.ceremony_venue = venueM[1].trim();
      result.venue_name = result.ceremony_venue;
    }

    const timeM = cb.match(/\*\*Time\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (timeM) result.ceremony_time = normalizeTime(timeM[1]);
  }

  // Reception Details
  const receptionBlock = text.match(/(?:#\s*Reception Details|##\s*Reception Details)[\s\S]*?(?=(?:---|#\s*Church Service|$))/i);
  if (receptionBlock) {
    const rb = receptionBlock[0];
    const titleM = rb.match(/\*\*Section Title\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (titleM) result.reception_title = titleM[1].trim();

    const subM = rb.match(/\*\*Section Subheading\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (subM) result.reception_subtitle = subM[1].trim();

    const venueM = rb.match(/\*\*Venue Name\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (venueM) result.reception_venue = venueM[1].trim();

    const timeM = rb.match(/\*\*Time\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (timeM) result.reception_time = normalizeTime(timeM[1]);

    const addrM = rb.match(/\*\*Address\*\*\s*[\r\n]+([^\r\n*#]+)/i);
    if (addrM) {
      result.reception_address = addrM[1].trim();
      result.venue_address = addrM[1].trim();
    }
  }

  // Prioritize Reception / Luncheon venue for Event Location (per user requirement)
  if (result.reception_venue) {
    result.location = formatEventLocation(result.reception_venue, result.location);
  }

  // Church Service & Wedding Program (Numbered or ### style)
  const programBlock = text.match(/(?:#\s*Church Service & Wedding Program|#\s*Program)[\s\S]*?(?=(?:---|#\s*Our Story|$))/i);
  if (programBlock) {
    const pb = programBlock[0];
    const itemRegex = /###\s*\d+\.\s*([^\r\n]+)[\s\S]*?\*\*Time:\*\*\s*([^\r\n]+)(?:[\s\S]*?\*\*Description:\*\*\s*([^\r\n#]+))?/g;
    let match;
    while ((match = itemRegex.exec(pb)) !== null) {
      result.program.push({
        title: match[1].trim(),
        time: normalizeTime(match[2]),
        description: match[3] ? match[3].trim() : ""
      });
    }
  }

  // Our Story
  const storyBlock = text.match(/(?:#\s*Our Story)[\s\S]*?(?=(?:---|#\s*Bridesmaids|$))/i);
  if (storyBlock) {
    const sb = storyBlock[0];
    const metM = sb.match(/##\s*How We Met[\s\S]*?(?=(?:##|---|#|$))/i);
    if (metM) {
      result.story_part1 = metM[0].replace(/##\s*How We Met/i, '').trim();
    }

    const quoteM = sb.match(/##\s*Special Quote[\s\S]*?(?=(?:##|---|#|$))/i);
    if (quoteM) {
      result.story_highlight = quoteM[0].replace(/##\s*Special Quote/i, '').trim();
    }

    const propM = sb.match(/##\s*The Proposal[\s\S]*?(?=(?:##|---|#|$))/i);
    if (propM) {
      result.story_part2 = propM[0].replace(/##\s*The Proposal/i, '').trim();
    }
  }

  // Bridesmaids (Only add if explicitly present in the text)
  const bmBlock = text.match(/(?:#\s*Bridesmaids)[\s\S]*?(?=(?:---|#\s*Groomsmen|$))/i);
  if (bmBlock) {
    const regex = /\*\*(Maid of Honou?r|Bridesmaid)\*\*\s*[\r\n]+([^\r\n*#]+)/gi;
    let m;
    while ((m = regex.exec(bmBlock[0])) !== null) {
      const memberName = m[2].trim();
      if (memberName && !/^leave blank/i.test(memberName)) {
        result.bridesmaids.push({
          role: m[1].trim(),
          name: memberName,
          photo: "",
          image: ""
        });
      }
    }
  }

  // Groomsmen (Only add if explicitly present in the text)
  const gmBlock = text.match(/(?:#\s*Groomsmen)[\s\S]*?(?=(?:---|#\s*Gift Options|$))/i);
  if (gmBlock) {
    const regex = /\*\*(Best Man|Groomsman)\*\*\s*[\r\n]+([^\r\n*#]+)/gi;
    let m;
    while ((m = regex.exec(gmBlock[0])) !== null) {
      const memberName = m[2].trim();
      if (memberName && !/^leave blank/i.test(memberName)) {
        result.groomsmen.push({
          role: m[1].trim(),
          name: memberName,
          photo: "",
          image: ""
        });
      }
    }
  }

  // Gift Options
  const giftBlock = text.match(/(?:#\s*Gift Options)[\s\S]*?(?=(?:---|#\s*Photo Gallery|$))/i);
  if (giftBlock) {
    const gb = giftBlock[0];
    if (gb.includes('Mobile Money')) {
      const providerM = gb.match(/\*\*Provider:\*\*\s*([^\r\n]+)/i);
      const numM = gb.match(/\*\*Number:\*\*\s*([^\r\n]+)/i);
      const nameM = gb.match(/\*\*Name:\*\*\s*([^\r\n]+)/i);
      result.gifts.push({
        type: "Mobile Money",
        details: `${providerM ? providerM[1].trim() : 'Mobile Money'}: ${numM ? numM[1].trim() : ''}${nameM ? ` (${nameM[1].trim()})` : ''}`,
        title: "Mobile Money"
      });
    }

    if (gb.includes('Bank Transfer')) {
      const bankM = gb.match(/\*\*Bank:\*\*\s*([^\r\n]+)/i);
      const accM = gb.match(/\*\*Account Number:\*\*\s*([^\r\n]+)/i);
      const accNameM = gb.match(/\*\*Account Name:\*\*\s*([^\r\n]+)/i);
      result.gifts.push({
        type: "Bank Account",
        details: `${bankM ? bankM[1].trim() : 'Bank'} Acc: ${accM ? accM[1].trim() : ''}${accNameM ? ` (${accNameM[1].trim()})` : ''}`,
        title: "Bank Transfer"
      });
    }
  }

  // ==========================================
  // PASS 2: NATURAL LANGUAGE REGEX FALLBACKS FOR ANY REMAINING EMPTY FIELDS
  // ==========================================

  // Couple Names — inline single-line patterns (use [^\n] to avoid cross-line matching)
  if (!result.bride_name || !result.groom_name) {
    const couplePatterns = [
      // "Join/Wedding of Name and Name"
      /(?:Join|Celebrate with|Wedding of|Union of|Marriage of)[ \t]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)?)[ \t]+(?:&|and)[ \t]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)?)/i,
      // "We, Name and Name, joyfully invite / are getting married"
      /We,?[ \t]+([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*)[ \t]*(?:&|and)[ \t]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*),?[ \t]*(?:joyfully invite|are getting married|cordially invite|invite you)/i,
      // "Name and Name request the honour / are getting married" — MUST be on same line
      /([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*)[ \t]*(?:&|and)[ \t]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*)[ \t]*(?:are getting married|invite you|request the honour|cordially invite|tie the knot)/i,
      // "Name & Name's wedding"
      /([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*)[ \t]*(?:&|and)[ \t]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)*)[ \t]*(?:'s[ \t]*wedding|wedding invitation)/i,
      // "Name & Name" alone on a single line
      /^([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)?)[ \t]*(&|\band\b)[ \t]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+)?)$/m,
    ];
    for (const pat of couplePatterns) {
      const match = text.match(pat);
      if (match) {
        const g1 = (match[1] || '').trim();
        const g2 = (match[2] || '').trim();
        // Sanity check: captured names should not contain newlines
        if (!g1.includes('\n') && !g2.includes('\n')) {
          if (!result.bride_name) result.bride_name = g1;
          if (!result.groom_name) result.groom_name = g2;
          break;
        }
      }
    }
  }

  // Couple Names — multi-line prose with blank lines between name and "and" separator
  // Handles: "Elena Sophia Vance\n\nand\n\nMarcus Alexander Hayes" (traditional formal invitations)
  if (!result.bride_name || !result.groom_name) {
    // Collapse the text into non-empty lines for easier matching
    const nonEmptyLines = text.split(/\n/).map(l => l.trim()).filter(Boolean);
    const nameRe = /^[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z]+){1,4}$/;
    const sepRe  = /^(?:&|and)$/i;
    for (let i = 0; i < nonEmptyLines.length - 2; i++) {
      const line1 = nonEmptyLines[i];
      const sep   = nonEmptyLines[i + 1];
      const line2 = nonEmptyLines[i + 2];
      if (nameRe.test(line1) && sepRe.test(sep) && nameRe.test(line2)) {
        if (!result.bride_name) result.bride_name = line1.trim();
        if (!result.groom_name) result.groom_name = line2.trim();
        break;
      }
    }
  }

  // Main Date
  if (!result.date) {
    const datePatterns = [
      // "Saturday, October 24, 2026" or "Saturday October 24 2026"
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+\s+[0-9]{1,2}(?:st|nd|rd|th)?,?\s+[0-9]{4})/i,
      // "October 24, 2026"
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{1,2}(?:st|nd|rd|th)?,?\s+[0-9]{4}/i,
      // "24 October 2026"
      /[0-9]{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{4}/i,
      /(?:Date|On|Day):\s*([0-9]{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]+,?\s+[0-9]{4})/i,
      /([0-9]{4}-[0-9]{2}-[0-9]{2})/,
      /([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})/,
    ];
    for (const pat of datePatterns) {
      const match = text.match(pat);
      if (match) {
        const raw = match[1] || match[0];
        const clean = normalizeDate(raw);
        if (clean) {
          result.date = clean;
          result.ceremony_date = clean;
          result.reception_date = clean;
          break;
        }
      }
    }
  }

  // Ceremony Time — written in words ("at half past four in the afternoon", "at seven o'clock in the evening")
  if (!result.ceremony_time) {
    const wordTimeMap = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
      eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12
    };
    // Try all "at ..." phrases — pick the FIRST that resolves to a valid time
    // This avoids early match on "at the celebration of..." which has no valid hour word
    const allAtMatches = [...text.matchAll(/at\s+(?:(half|quarter)\s+(?:past|after)\s+)?(\w+)(?:\s+o'?clock)?(?:\s+in\s+the\s+(morning|afternoon|evening|night))?/gi)];
    for (const wordTimeMatch of allAtMatches) {
      const half = wordTimeMatch[1];
      const hourWord = (wordTimeMatch[2] || '').toLowerCase();
      const period = (wordTimeMatch[3] || '').toLowerCase();
      const hourNum = wordTimeMap[hourWord] || parseInt(hourWord, 10);
      if (hourNum >= 1 && hourNum <= 12) {
        let h = hourNum;
        if (period === 'afternoon' || period === 'evening' || period === 'night') {
          if (h < 12) h += 12;
        }
        const m = half === 'half' ? 30 : (half === 'quarter' ? 15 : 0);
        result.ceremony_time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        break;
      }
    }
  }

  // Location — Zambian cities first
  if (!result.location) {
    const cityMatch = text.match(/\b(Lusaka|Ndola|Kitwe|Livingstone|Kabwe|Chingola|Mufulira|Solwezi|Chipata|Kasama|Zambia)\b/i);
    if (cityMatch) result.location = `${cityMatch[1]}, Zambia`;
  }

  // Location — General City, State/Country pattern for international venues
  // Only match lines that are PURELY "City, State" (no extra prose words before city)
  // e.g. "Silverlake, California" on its own line
  if (!result.location) {
    const cityStateMatch = text.match(
      /^([A-Z][a-zA-Z]{2,25}),\s*([A-Z][a-zA-Z\s]{2,20})$/m
    );
    if (cityStateMatch) {
      const cityPart = cityStateMatch[1].trim();
      const statePart = cityStateMatch[2].trim();
      // Ensure it's not a venue name (venue names usually have 3+ words)
      if (!cityPart.includes(' ') || cityPart.split(' ').length <= 2) {
        result.location = `${cityPart}, ${statePart}`;
      }
    }
  }

  // Ceremony Venue — labelled
  if (!result.ceremony_venue) {
    const ceremonyVenueMatch = text.match(/(?:Ceremony|Church Service|Church|Service|Holy Matrimony)(?:[\s\S]*?)(?:Venue|at):\s*([^\n\r,]+)/i);
    if (ceremonyVenueMatch) {
      result.ceremony_venue = ceremonyVenueMatch[1].replace(/(?:at\s+[0-9]{1,2}:[0-9]{2}\s*(?:am|pm)?|at\s+[0-9]{1,2}\s*(?:am|pm)?)/i, '').trim();
      result.venue_name = result.ceremony_venue;
    }
  }

  // Ceremony Venue — prose: look for a named venue ("The X") that appears near a date/time block
  // Used for formal invitations like "The Grand Palm Conservatory" without labels
  if (!result.ceremony_venue) {
    const namedVenueMatch = text.match(
      /^(The\s+[A-Z][a-zA-Z\s]{3,50})$/m
    );
    if (namedVenueMatch) {
      result.ceremony_venue = namedVenueMatch[1].trim();
      if (!result.venue_name) result.venue_name = result.ceremony_venue;
    }
  }

  // Venue Address — bare street address pattern (e.g. "742 Evergreen Terrace")
  if (!result.venue_address) {
    const streetMatch = text.match(
      /^([0-9]+(?:\s+[A-Z][a-zA-Z]+){1,5}(?:\s+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln|Court|Ct|Terrace|Place|Pl|Way|Circle|Cr))?)$/m
    );
    if (streetMatch) {
      result.venue_address = streetMatch[1].trim();
    }
  }

  // Reception / Luncheon Venue — labelled
  if (!result.reception_venue) {
    const receptionVenueMatch = text.match(/(?:Reception|Evening Reception|Party|Luncheon)(?:\s+at|\s*:)?(?:\s*[0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?\s*(?:at)?)?\s*([A-Z0-9'.\s]+?(?:Hotel|Gardens|Resort|Hall|Ballroom|Lodge|Club|Court|Inn)[^\n,.]*)/i);
    if (receptionVenueMatch) {
      result.reception_venue = receptionVenueMatch[1].replace(/(?:at\s+[0-9]{1,2}:[0-9]{2}\s*(?:am|pm)?|at\s+[0-9]{1,2}\s*(?:am|pm)?)/i, '').trim();
    }
  }

  // Prioritize Reception / Luncheon venue for Event Location (per user requirement)
  if (result.reception_venue) {
    result.location = formatEventLocation(result.reception_venue, result.location);
  } else if (result.ceremony_venue && result.location) {
    // If only ceremony venue: combine venue + city/state
    result.location = formatEventLocation(result.ceremony_venue, result.location);
  }

  // Program lines fallback
  if (result.program.length === 0) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    lines.forEach(line => {
      const scheduleMatch = line.match(/^([0-9]{1,2}:[0-9]{2}(?:\s*(?:AM|PM|am|pm))?)\s*[-–:]\s*(.+)$/);
      if (scheduleMatch) {
        result.program.push({
          time: normalizeTime(scheduleMatch[1]),
          title: scheduleMatch[2].trim(),
          description: ""
        });
      }
    });
  }

  // Bridesmaids & Groomsmen single-line fallback
  if (result.bridesmaids.length === 0) {
    const mohMatch = text.match(/(?:Maid\s*of\s*Honou?r):\s*([^\n\r,]+)/i);
    if (mohMatch && !/^leave blank/i.test(mohMatch[1])) {
      result.bridesmaids.push({ name: mohMatch[1].trim(), role: "Maid of Honor", photo: "", image: "" });
    }
    const bmSec = text.match(/(?:Bridesmaids?):\s*([^\n\r]+)/i);
    if (bmSec) {
      bmSec[1].split(/[,&]/).map(n => n.trim()).filter(Boolean).forEach(n => {
        if (!/^leave blank/i.test(n) && !result.bridesmaids.some(b => b.name.toLowerCase() === n.toLowerCase())) {
          result.bridesmaids.push({ name: n, role: "Bridesmaid", photo: "", image: "" });
        }
      });
    }
  }

  if (result.groomsmen.length === 0) {
    const bmMatch = text.match(/(?:Best\s*Man):\s*([^\n\r,]+)/i);
    if (bmMatch && !/^leave blank/i.test(bmMatch[1])) {
      result.groomsmen.push({ name: bmMatch[1].trim(), role: "Best Man", photo: "", image: "" });
    }
    const gmSec = text.match(/(?:Groomsmen?):\s*([^\n\r]+)/i);
    if (gmSec) {
      gmSec[1].split(/[,&]/).map(n => n.trim()).filter(Boolean).forEach(n => {
        if (!/^leave blank/i.test(n) && !result.groomsmen.some(g => g.name.toLowerCase() === n.toLowerCase())) {
          result.groomsmen.push({ name: n, role: "Groomsman", photo: "", image: "" });
        }
      });
    }
  }

  // Gifts fallback
  if (result.gifts.length === 0) {
    const phoneMatches = text.matchAll(/(?:(Airtel|MTN|Zamtel|Mobile\s*Money))(?:\s*Money)?(?:\s*to)?:?\s*([0-9\s]{9,15})(?:\s*\(([^)]+)\))?/gi);
    for (const pm of phoneMatches) {
      const network = pm[1].trim();
      const phone = pm[2].trim().replace(/\s+/g, ' ');
      const recipient = pm[3] ? pm[3].trim() : "";
      result.gifts.push({
        type: "Mobile Money",
        details: `${network}: ${phone}${recipient ? ` (${recipient})` : ''}`,
        title: `${network} Mobile Money`
      });
    }
  }

  // Final verification & cleanup: filter out any empty party members
  result.bridesmaids = result.bridesmaids.filter(b => b && b.name && b.name.trim() !== "");
  result.groomsmen = result.groomsmen.filter(g => g && g.name && g.name.trim() !== "");

  return result;
}

/**
 * Main AI Parsing Function
 * Tries LLM (Groq / Gemini / custom key) first with structured JSON.
 * If API fails or key is missing, smoothly falls back to local rule-based parser.
 */
export async function parseWeddingDetailsWithAI({
  text,
  apiKey = "",
  provider = "groq"
}) {
  if (!text || !text.trim()) {
    throw new Error("Please enter or paste wedding details to parse.");
  }

  const envKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GROQ_API_KEY) || 
    (typeof process !== 'undefined' && process.env && process.env.VITE_GROQ_API_KEY) || 
    "";

  const effectiveKey = apiKey.trim() ||
    (typeof window !== "undefined" && localStorage.getItem('savemeaseat_ai_key')) ||
    envKey ||
    "";

  // System prompt describing schema and formatting rules
  const systemPrompt = `You are an expert wedding invitation parser and event setup assistant for SaveMeASeat Zambia.
Given unstructured text (invitation card, WhatsApp broadcast, or notes), extract all relevant wedding event data.

CRITICAL RULES:
1. SKIP ALL IMAGES: Do not output any URLs or image values. Leave all image fields empty ("" or []).
2. IF SOMETHING IS NOT MENTIONED OR FOUND IN THE TEXT, LEAVE IT AS AN EMPTY STRING ("") OR EMPTY ARRAY ([]). DO NOT invent fictional filler.
3. Template IDs:
   1: Default Elegance
   2: Golden Romance
   3: Botanical Olive
   4: Terracotta Earth
   5: Tropical Elegance
   6: Modern Classic
4. Maximum Guests: Return ["1", "2"] for plus one allowed, or ["1"] if strictly 1 guest.
5. Format dates as YYYY-MM-DD. Format times as HH:mm in 24hr or hh:mm AM/PM.

Return ONLY a valid JSON object matching this exact schema:

{
  "bride_name": "Full name of Bride, or empty string",
  "bride_description": "Bio or description if mentioned, else empty string",
  "groom_name": "Full name of Groom, or empty string",
  "groom_description": "Bio or description if mentioned, else empty string",
  "tagline": "Page tagline text, e.g. 'We are getting married' or custom if mentioned",
  "template_id": 1,
  "date": "YYYY-MM-DD (main wedding date, or empty string)",
  "location": "City, Country or empty string",
  "rsvp_deadline": "YYYY-MM-DD or empty string",
  "dress_code": "Dress code title or empty string",
  "dress_code_desc": "Dress code guidelines or empty string",
  "extra_card_text": "Pass Card Extra Text, e.g. Monetary gift guidelines, K350 per person, adults only, or empty string",
  "theme_colors": ["#1st_Accent", "#2nd_PageBg", "#3rd_CardBg", "#4th_TextColor"],
  "dress_code_colors": ["#HEX1", "#HEX2"],
  "allowed_guests": ["1", "2"],
  "venue_name": "Venue name or empty string",
  "venue_address": "Venue address or empty string",
  "venue_description": "Brief venue note or empty string",
  "ceremony_title": "Holy Matrimony",
  "ceremony_subtitle": "Subtitle or empty string",
  "ceremony_venue": "Name of Church or ceremony venue",
  "ceremony_date": "YYYY-MM-DD",
  "ceremony_time": "HH:mm",
  "reception_title": "Wedding Reception",
  "reception_subtitle": "Subtitle or empty string",
  "reception_venue": "Name of Reception venue",
  "reception_date": "YYYY-MM-DD",
  "reception_time": "HH:mm",
  "reception_address": "Reception address or empty string",
  "program": [
    { "time": "09:30 AM", "title": "Part title", "description": "" }
  ],
  "story_part1": "How We Met or empty string if not mentioned",
  "story_highlight": "Special quote or empty string if not mentioned",
  "story_part2": "The Proposal or empty string if not mentioned",
  "bridesmaids": [
    { "name": "Name", "role": "Maid of Honor / Bridesmaid", "image": "" }
  ],
  "groomsmen": [
    { "name": "Name", "role": "Best Man / Groomsman", "image": "" }
  ],
  "gifts": [
    { "type": "Mobile Money", "details": "Airtel / MTN details", "title": "Mobile Money" }
  ],
  "cover_image": "",
  "bride_image": "",
  "groom_image": "",
  "gallery_images": [],
  "slider_images": []
}

Rules:
- Format all dates strictly as YYYY-MM-DD. If year is missing, assume 2026.
- If dress code mentions specific colors (like Emerald Green and Gold), map them to matching hex codes.
- If program schedule times are mentioned, break them into the program array.
- DO NOT wrap the output in markdown code blocks like \`\`\`json. Return pure JSON string.`;

  // If we have an API key, call Groq LLM
  if (effectiveKey && effectiveKey !== "your_groq_api_key_here") {
    const modelsToTry = [
      "llama-3.3-70b-versatile",
      "llama-3.1-8b-instant",
      "qwen-2.5-32b",
      GROQ_MODEL,
      ...FALLBACK_MODELS
    ];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(GROQ_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${effectiveKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Here is the wedding details text:\n\n${text}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.2,
            max_tokens: 2000
          })
        });

        if (response.status === 401) {
          console.warn("[AI Wedding Parser] 401 Unauthorized with provided key, switching immediately to local rule parser.");
          break; // Stop immediately, do not loop over fallback models with the same invalid key!
        }

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            return sanitizeAndEnrichParsedData(parsed, text);
          }
        }
      } catch (e) {
        console.warn(`[AI Wedding Parser] Model ${model} failed, trying next fallback...`, e);
      }
    }
  }

  // Graceful Fallback: Local Rule-Based NLP Parser
  console.info("[AI Wedding Parser] Using high-precision local rule parser...");
  const localResult = parseWeddingWithLocalRules(text);
  return localResult;
}

/**
 * Sanitizes and fills any gaps in LLM output to guarantee complete compatibility
 * with AddWedding's formData state.
 */
function sanitizeAndEnrichParsedData(parsed, rawText) {
  const fallback = parseWeddingWithLocalRules(rawText);
  const recVenue = parsed.reception_venue || fallback.reception_venue || "";
  const rawLoc = parsed.location || fallback.location || "";
  const finalLocation = formatEventLocation(recVenue, rawLoc);

  return {
    ...fallback,
    ...parsed,
    location: finalLocation,
    // Always skip images as requested (user will upload them manually)
    cover_image: "",
    bride_image: "",
    groom_image: "",
    gallery_images: [],
    slider_images: [],
    date: normalizeDate(parsed.date) || fallback.date,
    ceremony_date: normalizeDate(parsed.ceremony_date || parsed.date) || fallback.ceremony_date,
    reception_date: normalizeDate(parsed.reception_date || parsed.date) || fallback.reception_date,
    rsvp_deadline: normalizeDate(parsed.rsvp_deadline) || fallback.rsvp_deadline,
    ceremony_time: normalizeTime(parsed.ceremony_time) || fallback.ceremony_time,
    reception_time: normalizeTime(parsed.reception_time) || fallback.reception_time,
    program: Array.isArray(parsed.program) ? parsed.program : fallback.program,
    bridesmaids: (Array.isArray(parsed.bridesmaids) ? parsed.bridesmaids : fallback.bridesmaids)
      .filter(b => b && b.name && b.name.trim() && !/^leave blank/i.test(b.name))
      .map(b => ({ ...b, photo: b.photo || "", image: b.image || "" })),
    groomsmen: (Array.isArray(parsed.groomsmen) ? parsed.groomsmen : fallback.groomsmen)
      .filter(g => g && g.name && g.name.trim() && !/^leave blank/i.test(g.name))
      .map(g => ({ ...g, photo: g.photo || "", image: g.image || "" })),
    gifts: Array.isArray(parsed.gifts) ? parsed.gifts : fallback.gifts,
    theme_colors: Array.isArray(parsed.theme_colors) && parsed.theme_colors.length >= 4 ? parsed.theme_colors : fallback.theme_colors,
    dress_code_colors: Array.isArray(parsed.dress_code_colors) ? parsed.dress_code_colors : fallback.dress_code_colors,
    allowed_guests: Array.isArray(parsed.allowed_guests) && parsed.allowed_guests.length > 0 ? parsed.allowed_guests : ["1", "2"]
  };
}
