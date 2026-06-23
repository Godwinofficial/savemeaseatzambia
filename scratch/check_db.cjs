const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-base'); // let's see if we have @supabase/supabase-js

// Load env variables manually from .env.local or .env
let envFile = '';
if (fs.existsSync(path.join(__dirname, '../.env.local'))) {
    envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
} else if (fs.existsSync(path.join(__dirname, '../.env'))) {
    envFile = fs.readFileSync(path.join(__dirname, '../.env'), 'utf-8');
}

const envVars = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*VITE_SUPABASE_([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (match) {
        envVars[match[1]] = match[2].trim().replace(/(^['"]|['"]$)/g, '');
    }
});

const url = envVars.URL;
const key = envVars.ANON_KEY;

if (!url || !key) {
    console.error("Could not load VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from environment files.");
    process.exit(1);
}

// Dynamically import or require supabase-js
// If not installed, we will use standard fetch to query
async function check() {
    const weddingsUrl = `${url}/rest/v1/weddings?select=*`;
    const rsvpsUrl = `${url}/rest/v1/rsvps?select=id,wedding_id,status`;

    try {
        const weddingsRes = await fetch(weddingsUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const weddings = await weddingsRes.json();

        const rsvpsRes = await fetch(rsvpsUrl, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const rsvps = await rsvpsRes.json();

        console.log(`=== DATABASE STATS ===`);
        console.log(`Total Weddings: ${weddings.length}`);
        console.log(`Total RSVPs: ${rsvps.length}`);

        const totalViews = weddings.reduce((sum, w) => sum + (w.views || 0), 0);
        console.log(`Total Views in Weddings table: ${totalViews}`);

        console.log(`\n=== WEDDINGS LIST ===`);
        weddings.forEach(w => {
            const count = rsvps.filter(r => r.wedding_id === w.id).length;
            console.log(`ID: ${w.id} | Groom: ${w.groom_name} | Bride: ${w.bride_name} | RSVPs: ${count} | Views: ${w.views || 0}`);
        });
    } catch (e) {
        console.error("Error checking database:", e);
    }
}

check();
