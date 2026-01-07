export default async function handler(req, res) {
    const { slug } = req.query;

    // Define the base URL for fetching index.html
    // VERCEL_URL is provided by Vercel, but doesn't include https://
    const appUrl = process.env.VITE_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://savemeaseatzambia.vercel.app');

    if (!slug) {
        return res.redirect(307, '/');
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials');
            return res.redirect(307, `/w/${slug}`);
        }

        // 1. Fetch the wedding data
        const response = await fetch(
            `${supabaseUrl}/rest/v1/weddings?slug=eq.${slug}&select=*`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const data = await response.json();
        let wedding = null;

        if (data && data.length > 0) {
            wedding = data[0];
        }

        // 2. Fetch the actual index.html from the deployment
        // This ensures we always serve the latest app code (script tags, etc.)
        const indexResponse = await fetch(`${appUrl}/index.html`);
        let html = await indexResponse.text();

        // If we found the wedding, inject the meta tags
        if (wedding) {
            const brideName = wedding.bride_name || 'Bride';
            const groomName = wedding.groom_name || 'Groom';
            const weddingDate = wedding.date || ''; // You might want to format this

            // Ensure cover image is an absolute URL
            let coverImage = wedding.cover_image || (wedding.slider_images && wedding.slider_images[0]) || `${appUrl}/imgs/logo1.png`;
            if (coverImage.startsWith('/')) {
                coverImage = `${appUrl}${coverImage}`;
            }

            const title = `${brideName} & ${groomName} | Wedding`;
            const description = `You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!`;

            // Helper to replace or add meta tags
            // We use simple string replacement which is faster/safer than DOM parsing for this specific case
            const replaceMeta = (tag, newValue) => {
                const regex = new RegExp(tag, 'g');
                html = html.replace(regex, newValue);
            };

            // Replace Title
            // Note: This assumes <title>...</title> exists in index.html. 
            // If it matches exactly what's in index.html, we replace it. 
            // Better strategy: Replace the whole <title> tag.
            html = html.replace(/<title>.*<\/title>/, `<title>${title}</title>`);

            // Replace standard Description
            // Assuming <meta name="description" content="..." />
            html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${description}" />`);

            // Replace or Inject Open Graph Tags
            // We will strip existing OG tags to avoid duplicates, then append ours to the head
            html = html.replace(/<meta property="og:.*?>/g, '');
            html = html.replace(/<meta name="twitter:.*?>/g, '');

            const newMetaTags = `
    <!-- Dynamic Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${appUrl}/w/${slug}" />
    <meta property="og:site_name" content="SaveMeASeat Zambia" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${coverImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <!-- Dynamic Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${appUrl}/w/${slug}" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${coverImage}" />
            `;

            // Inject before </head>
            html = html.replace('</head>', `${newMetaTags}</head>`);
        }

        // 3. Return the modified HTML
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=0'); // Don't cache the HTML on the edge for too long to allow updates
        return res.status(200).send(html);

    } catch (error) {
        console.error('Error in wedding-meta:', error);
        // Fallback: Redirect to the client-side route
        // This ensures the user still sees the content even if meta generation fails
        return res.redirect(307, `/index.html#/w/${slug}`); // Or just /w/${slug} if rewrites handle it, but infinite loop risk
    }
}
