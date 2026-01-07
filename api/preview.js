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

    // Get slug from query params
    const { searchParams } = new URL(request.url, `http://${request.headers.host}`);
    const slug = searchParams.get('slug');

    if (!slug) {
        return response.status(400).send('Missing slug parameter');
    }

    try {
        // defaults
        let title = "Wedding Invitation";
        let description = "You are invited against a wedding celebration.";
        let image = "https://savemeseatzambia.com/imgs/logo1.png"; // Default fallback
        let redirectUrl = `/w/${slug}`;

        // Fetch wedding data
        const { data: wedding, error } = await supabase
            .from('weddings')
            .select('bride_name, groom_name, date, cover_image, location, venue_name')
            .eq('slug', slug)
            .single();

        if (error) {
            console.error('Supabase error:', error);
            // We still return a page that redirects, but maybe with generic metadata
        } else if (wedding) {
            title = `${wedding.bride_name} & ${wedding.groom_name} | Wedding Invitation`;
            description = `Join us on ${new Date(wedding.date).toLocaleDateString()} at ${wedding.venue_name || wedding.location}.`;
            if (wedding.cover_image) {
                image = wedding.cover_image;
            }
        }

        // HTML Template with Dynamic Meta Tags and Redirect
        // key: using minimal responsive meta tags for best preview
        const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="website">
        <meta property="og:title" content="${title}">
        <meta property="og:description" content="${description}">
        <meta property="og:image" content="${image}">
        
        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${title}">
        <meta name="twitter:description" content="${description}">
        <meta name="twitter:image" content="${image}">

        <!-- WhatsApp usually uses OG tags, but ensure image size is reasonable (handled by user upload usually) -->

        <style>
          body { font-family: sans-serif; text-align: center; padding: 50px; background: #fafaf9; color: #57534E; }
          .loader { margin: 20px auto; border: 4px solid #f3f3f3; border-top: 4px solid #A68A64; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        
        <script>
           // Redirect immediately
           setTimeout(function() {
             window.location.href = "${redirectUrl}";
           }, 500); // Small delay to let crawlers see tags? usually not needed but 100-500ms is safe
        </script>
      </head>
      <body>
        <h1>${wedding && wedding.bride_name ? "Save Me A Seat" : "Loading..."}</h1>
        <p>Redirecting to invitation...</p>
        <div class="loader"></div>
        <noscript>
            <p>If you are not redirected, <a href="${redirectUrl}">click here</a>.</p>
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
