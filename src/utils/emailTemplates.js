export const getEmailTemplate = (params) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${params.title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <div style="background-color: #eef2f5; background-image: radial-gradient(#dae2e9 0.5px, transparent 0.5px); background-size: 12px 12px; padding: 45px 20px;">
        <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 15px 35px -10px rgba(0,10,30,0.08); border: 1px solid rgba(255,255,255,0.3); backdrop-filter: blur(2px);">
            <!-- header -->
            <div style="padding: 32px 32px 16px 32px; text-align: center; border-bottom: 1px solid #f0f2f4;">
                <span style="display: inline-block; background-color: ${params.badge_bg_color}; color: ${params.badge_text_color}; font-size: 13px; font-weight: 600; letter-spacing: 0.6px; text-transform: uppercase; padding: 6px 14px; border-radius: 40px; margin-bottom: 16px;">
                    ${params.status_badge_text}
                </span>
                <h1 style="margin: 0; color: #1e2b36; font-size: 26px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2;">
                    ${params.title}
                </h1>
            </div>

            <!-- content -->
            <div style="padding: 24px 32px 16px 32px; color: #2c3e4e; font-size: 16px; line-height: 1.6;">
                <p style="margin: 0 0 24px 0; font-weight: 450;">Hi ${params.to_name},</p>

                <!-- Alert Box -->
                <p style="margin: 0 0 18px 0; background-color: ${params.light_theme_color}; padding: 20px 22px; border-radius: 20px; border-left: 4px solid ${params.theme_color}; color: #1f2e3a;">
                    <span style="font-weight: 650; color: ${params.theme_color};">${params.alert_icon} ${params.alert_title}</span><br>
                    <span style="display: block; margin-top: 4px;">For the wedding of <strong style="font-weight: 650; color: #162b33;">${params.wedding_name}</strong>.</span>
                </p>

                <!-- Message -->
                <p style="margin: 0 0 12px 0; color: #364f5e;">
                    ${params.message}
                </p>
                <p style="margin: 0 0 8px 0; color: #364f5e;">
                    <span style="background-color: #f0f3f5; padding: 2px 8px; border-radius: 20px; font-size: 15px;">⏺️ ${params.action_note}</span>
                </p>
            </div>

            <!-- event details -->
            <div style="margin: 8px 32px 24px 32px; background-color: #f6f9fb; padding: 24px; border-radius: 20px; border: 1px solid #e6edf2;">
                <p style="margin: 0 0 16px 0; font-size: 13px; color: #4c6a78; text-transform: uppercase; font-weight: 600; letter-spacing: 0.8px; border-bottom: 1px solid #e1e7ec; padding-bottom: 8px;">
                    📌 Event Details
                </p>

                <!-- Couple -->
                <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 12px; color: #7c959f; font-weight: 600; text-transform: uppercase;">Celebrating</p>
                    <p style="margin: 2px 0 0 0; font-weight: 680; color: #1e333b; font-size: 17px;">
                        ${params.wedding_name}
                    </p>
                </div>

                <!-- Date & Time -->
                <div style="margin-bottom: 12px;">
                    <p style="margin: 0; font-size: 12px; color: #7c959f; font-weight: 600; text-transform: uppercase;">When</p>
                    <p style="margin: 2px 0 0 0; color: #3f5a66; font-weight: 500; font-size: 15px;">
                        ${params.event_date}
                    </p>
                </div>

                <!-- Venue & Address -->
                <div>
                    <p style="margin: 0; font-size: 12px; color: #7c959f; font-weight: 600; text-transform: uppercase;">Where</p>
                    <p style="margin: 2px 0 0 0; color: #1e333b; font-weight: 600; font-size: 15px;">
                        ${params.venue}
                    </p>
                    <p style="margin: 2px 0 0 0; color: #5a707a; font-size: 14px;">
                        ${params.location}
                    </p>
                </div>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; padding: 0 32px 32px;">
                <a href="${params.link}" target="_blank" style="display: inline-block; background-color: #1e2b36; color: #ffffff; padding: 14px 32px; border-radius: 99px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.2s;">
                    ${params.action_text}
                </a>
            </div>

        </div>

        <!-- footer -->
        <div style="max-width: 560px; margin: 0 auto; text-align: center; padding-top: 32px;">
            <p style="color: #a3b6bf; font-size: 13px; margin: 0; letter-spacing: 0.2px;">
                Sent via <span style="font-weight: 500; color: #7c959f;">Save Me A Seat Zambia</span> — ${params.footer_text}
            </p>
            <p style="color: #b1c4cb; font-size: 11px; margin-top: 8px;">
                ${params.footer_subtext}
            </p>
        </div>

    </div>
</body>
</html>
    `;
};
