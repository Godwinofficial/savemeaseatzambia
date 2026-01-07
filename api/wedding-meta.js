export default async function handler(req, res) {
    const { slug } = req.query;

    if (!slug) {
        return res.redirect(307, '/');
    }

    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('Missing Supabase credentials');
            return res.redirect(307, '/');
        }

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

        if (data && data.length > 0) {
            const wedding = data[0];
            const brideName = wedding.bride_name || 'Bride';
            const groomName = wedding.groom_name || 'Groom';
            const weddingDate = wedding.date || '';
            const coverImage = wedding.cover_image || (wedding.slider_images && wedding.slider_images[0]) || 'https://savemeaseatzambia.vercel.app/imgs/logo1.png';

            const title = `${brideName} & ${groomName} | Wedding`;
            const description = `You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!`;

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  
  <!-- Primary Meta Tags -->
  <title>${title}</title>
  <meta name="title" content="${title}" />
  <meta name="description" content="${description}" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://savemeaseatzambia.vercel.app/w/${slug}" />
  <meta property="og:site_name" content="SaveMeASeat Zambia" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${coverImage}" />
  <meta property="og:image:secure_url" content="${coverImage}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="${title}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="https://savemeaseatzambia.vercel.app/w/${slug}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${coverImage}" />
  
  <!-- WhatsApp specific -->
  <meta property="og:locale" content="en_US" />
  
  <link rel="icon" type="image/png" href="/imgs/logo1.png" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=3600');
            return res.status(200).send(html);
        } else {
            return res.redirect(307, '/');
        }
    } catch (error) {
        console.error('Error fetching wedding:', error);
        return res.redirect(307, '/');
    }
}
