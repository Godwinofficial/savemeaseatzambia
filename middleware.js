import { NextResponse } from 'next/server';

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    // Only handle wedding pages
    if (pathname.startsWith('/w/')) {
        const slug = pathname.split('/w/')[1];

        if (!slug) {
            return NextResponse.next();
        }

        try {
            // Fetch wedding data from Supabase
            const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
            const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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

                // Generate dynamic HTML with meta tags
                const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${brideName} & ${groomName} | Wedding</title>
  <meta name="title" content="${brideName} & ${groomName} | Wedding" />
  <meta name="description" content="You're invited to celebrate the wedding of ${brideName} and ${groomName}${weddingDate ? ' on ' + weddingDate : ''}. Join us for this special day!" />
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${request.url}" />
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
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`;

                return new NextResponse(html, {
                    headers: {
                        'Content-Type': 'text/html',
                    },
                });
            }
        } catch (error) {
            console.error('Error fetching wedding data:', error);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: '/w/:slug*',
};
