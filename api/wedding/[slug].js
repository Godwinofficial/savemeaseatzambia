export default async function handler(req, res) {
    const { slug } = req.query;

    if (!slug) {
        return res.status(400).json({ error: 'Slug is required' });
    }

    try {
        // Fetch wedding data from Supabase
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
            `${supabaseUrl}/rest/v1/weddings?slug=eq.${slug}&select=*`,
            {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
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

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brideName} & ${groomName} | Wedding</title>
  <meta name="title" content="${brideName} & ${groomName} | Wedding" />
  <meta name="description" content="You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://savemeaseatzambia.vercel.app/w/${slug}" />
  <meta property="og:title" content="${brideName} & ${groomName} | Wedding" />
  <meta property="og:description" content="You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!" />
  <meta property="og:image" content="${coverImage}" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${brideName} & ${groomName} | Wedding" />
  <meta name="twitter:description" content="You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!" />
  <meta name="twitter:image" content="${coverImage}" />
  
  <link rel="icon" type="image/png" href="/imgs/logo1.png" />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />
  <script>
    // Redirect to the actual React app after meta tags are loaded
    window.location.replace('/w/${slug}#loaded');
  </script>
</head>
<body>
  <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: 'Poppins', sans-serif;">
    <div style="text-align: center;">
      <h1 style="color: #269691;">${brideName} & ${groomName}</h1>
      <p>Loading your wedding invitation...</p>
    </div>
  </div>
</body>
</html>`;

            res.setHeader('Content-Type', 'text/html');
            return res.status(200).send(html);
        } else {
            return res.status(404).json({ error: 'Wedding not found' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
