import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Note: In Vercel serverless functions, we use process.env for environment variables.
// Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export default async function handler(request, response) {
    // Check if credentials are present
    if (!supabaseUrl || !supabaseAnonKey) {
        const errorDetails = `
      Missing Supabase credentials.
      VITE_SUPABASE_URL: ${supabaseUrl ? 'Found' : 'Missing'}
      VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Found' : 'Missing'}
      
      Debug:
      - Env Keys: ${Object.keys(process.env).filter(k => k.startsWith('VITE')).join(', ')}
    `;
        console.error(errorDetails);
        return response.status(500).send(errorDetails);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get slug and type from query params
    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const slug = searchParams.get('slug');
    const type = searchParams.get('type') || 'wedding'; // default to wedding

    if (!slug) {
        return response.status(400).send('Missing slug parameter');
    }

    try {
        // defaults
        let title = "Invitation";
        let description = "You are invited to a celebration.";
        let image = "https://savemeaseatzambia.com/imgs/logo1.png"; // Fixed typo: savemeaseat
        let redirectUrl = type === 'birthday' ? `/b/${slug}` : `/w/${slug}`;

        if (type === 'birthday') {
            // Fetch birthday data
            const { data: bday, error } = await supabase
                .from('birthday_events')
                .select('child_name, age, date, hero_image, venue_name')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Supabase birthday error:', error);
            } else if (bday) {
                title = `${bday.child_name}'s Birthday Invitation`;
                description = `Join us on ${new Date(bday.date).toLocaleDateString()} at ${bday.venue_name || 'the venue'}.`;
                if (bday.hero_image) image = bday.hero_image;
            }
        } else {
            // Fetch wedding data
            const { data: wedding, error } = await supabase
                .from('weddings')
                .select('bride_name, groom_name, date, cover_image, location, venue_name')
                .eq('slug', slug)
                .single();

            if (error) {
                console.error('Supabase wedding error:', error);
            } else if (wedding) {
                title = `${wedding.bride_name} & ${wedding.groom_name} | Wedding Invitation`;
                description = `Join us on ${new Date(wedding.date).toLocaleDateString()} at ${wedding.venue_name || wedding.location}.`;
                if (wedding.cover_image) image = wedding.cover_image;
            }
        }

        // Append a timestamp to the image URL to prevent aggressive caching by WhatsApp
        const imageWithCacheBust = image.includes('?') ? `${image}&t=${Date.now()}` : `${image}?t=${Date.now()}`;

        // HTML Template with Dynamic Meta Tags and Redirect
        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:url" content="${request.url}">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:site_name" content="SaveMeASeat">
        
        <meta property="og:image" content="${imageWithCacheBust}">
        <meta property="og:image:secure_url" content="${imageWithCacheBust}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="Wedding Invitation">
        <meta property="og:image:type" content="image/jpeg">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${imageWithCacheBust}">

        <!-- WhatsApp / Schema.org -->
        <meta itemprop="name" content="${title}">
        <meta itemprop="description" content="${description}">
        <meta itemprop="image" content="${imageWithCacheBust}">

        <script>
           window.location.href = "${redirectUrl}";
        </script>
      </head>
      <body>
        <noscript>
            <p><a href="${redirectUrl}">Click here</a></p>
        </noscript>
      </body>
      </html>
    `;

        // Vercel Serverless Functions - returning HTML
        response.setHeader('Content-Type', 'text/html');
        response.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate=59'); // Cache short duration
        return response.status(200).send(html);

    } catch (err) {
        console.error('Server error:', err);
        return response.status(500).send('Internal Server Error');
    }
}
