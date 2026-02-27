import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Initialize Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const now = new Date()
        const todayStr = now.toISOString().slice(0, 10)

        console.log('🔔 Checking for due reminders at:', now.toISOString())

        // Fetch all weddings
        const { data: allWeddings, error: weddingsError } = await supabaseClient
            .from('weddings')
            .select('*')

        if (weddingsError) throw weddingsError

        console.log(`Found ${allWeddings?.length || 0} total weddings`)

        // Filter for weddings with due reminders
        const dueWeddings = (allWeddings || []).filter(w => {
            let isDue = false

            // Check Day Of Event Reminder
            if (w.reminder_day_of_event_enabled && !w.reminder_sent_day_of) {
                const eventDate = new Date(w.date).toISOString().slice(0, 10)
                if (eventDate === todayStr) {
                    isDue = true
                    console.log(`  ✅ Day-of reminder due for: ${w.groom_name} & ${w.bride_name}`)
                }
            }

            // Check Custom Reminder
            if (w.reminder_custom_date && !w.reminder_sent_custom) {
                const customDate = new Date(w.reminder_custom_date)
                if (customDate <= now) {
                    isDue = true
                    console.log(`  ✅ Custom reminder due for: ${w.groom_name} & ${w.bride_name}`)
                }
            }

            return isDue
        })

        console.log(`📊 Found ${dueWeddings.length} wedding(s) with due reminders`)

        let totalEmailsSent = 0
        let processedWeddings = 0

        // Process each wedding
        for (const wedding of dueWeddings) {
            console.log(`\n📨 Processing: ${wedding.groom_name} & ${wedding.bride_name}`)

            // Fetch approved guests with email
            const { data: guests, error: guestsError } = await supabaseClient
                .from('rsvps')
                .select('email, name')
                .eq('wedding_id', wedding.id)
                .eq('status', 'approved')
                .not('email', 'is', null)

            if (guestsError) {
                console.error(`  ❌ Error fetching guests:`, guestsError)
                continue
            }

            console.log(`  Found ${guests?.length || 0} approved guest(s) with email`)

            // Send emails via EmailJS
            for (const guest of guests || []) {
                const emailData = {
                    service_id: Deno.env.get('EMAILJS_SERVICE_ID'),
                    template_id: Deno.env.get('EMAILJS_TEMPLATE_ID'),
                    user_id: Deno.env.get('EMAILJS_PUBLIC_KEY'),
                    template_params: {
                        to_email: guest.email,
                        email: guest.email,
                        to_name: guest.name,
                        wedding_name: `${wedding.groom_name} & ${wedding.bride_name}`,
                        event_date: new Date(wedding.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit'
                        }),
                        venue: wedding.venue_name || 'TBA',
                        location: wedding.location || '',
                        message: `This is a friendly reminder that the wedding of ${wedding.groom_name} & ${wedding.bride_name} is coming up! We're so excited to celebrate with you. Please be ready and we can't wait to see you there!`,
                        link: `https://savemeaseatzambia.com/w/${wedding.slug}`,
                        title: `${wedding.groom_name} & ${wedding.bride_name} Wedding`,
                        subtitle: "Wedding Reminder",
                        action_text: "View Invitation & Details",
                        // Dynamic Theme Params (Blue/Indigo for Reminders)
                        theme_color: "#4f46e5",
                        light_theme_color: "#eef2ff",
                        status_badge_text: "✔ REMINDER",
                        badge_bg_color: "#e0e7ff",
                        badge_text_color: "#4338ca",
                        alert_title: "wedding reminder",
                        alert_icon: "🔔",
                        // Dynamic Content for Reminders
                        action_note: "see event details below",
                        footer_text: "wedding reminder",
                        footer_subtext: "we look forward to celebrating with you"
                    }
                }

                try {
                    const emailResponse = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(emailData)
                    })

                    if (emailResponse.ok) {
                        console.log(`    ✅ Sent to ${guest.email}`)
                        totalEmailsSent++
                    } else {
                        const errorText = await emailResponse.text()
                        console.error(`    ❌ Failed to send to ${guest.email}:`, errorText)
                    }

                    // Small delay to avoid rate limits
                    await new Promise(r => setTimeout(r, 500))
                } catch (emailError) {
                    console.error(`    ❌ Error sending to ${guest.email}:`, emailError)
                }
            }

            // Update sent flags in database
            const updates: any = {}
            const eventDate = new Date(wedding.date).toISOString().slice(0, 10)

            if (wedding.reminder_day_of_event_enabled && !wedding.reminder_sent_day_of && eventDate === todayStr) {
                updates.reminder_sent_day_of = true
            }
            if (wedding.reminder_custom_date && !wedding.reminder_sent_custom && new Date(wedding.reminder_custom_date) <= now) {
                updates.reminder_sent_custom = true
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabaseClient
                    .from('weddings')
                    .update(updates)
                    .eq('id', wedding.id)

                if (updateError) {
                    console.error(`  ❌ Error updating database:`, updateError)
                } else {
                    console.log(`  ✅ Updated database:`, updates)
                    processedWeddings++
                }
            }
        }

        const result = {
            success: true,
            timestamp: now.toISOString(),
            totalWeddings: allWeddings?.length || 0,
            dueWeddings: dueWeddings.length,
            processedWeddings,
            totalEmailsSent
        }

        console.log('\n🎉 Summary:', result)

        return new Response(
            JSON.stringify(result),
            {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )
    } catch (error) {
        console.error('❌ Error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            }),
            {
                status: 500,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            }
        )
    }
})
