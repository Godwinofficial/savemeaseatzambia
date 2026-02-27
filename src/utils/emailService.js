import { EMAIL_TEMPLATE } from './emailTemplate';

/**
 * Sends an email using the API endpoint.
 * @param {Object} options - The email options.
 * @param {string} options.to - Recipient email.
 * @param {string} options.subject - Email subject.
 * @param {Object} options.templateParams - Parameters to replace in the template.
 */
export const sendEmail = async ({ to, subject, html, templateParams }) => {
    try {
        let emailHtml = html;

        if (!emailHtml) {
            emailHtml = EMAIL_TEMPLATE;
            const params = { ...templateParams };

            // Handle newlines in message
            if (params.message) {
                params.message = params.message.replace(/\n/g, '<br>');
            }

            // Default Logo URL if not provided
            if (!params.logo_url) {
                params.logo_url = 'https://www.savemeaseatzambia.com/imgs/logo1.png';
            }

            // Handle optional images (single or multiple)
            let imagesHtml = '';

            // Normalize image_url(s) to an array
            const imageUrls = params.image_urls || (params.image_url ? [params.image_url] : []);

            if (imageUrls.length > 0) {
                imagesHtml = imageUrls.map(url => `
                <tr>
                    <td style="padding: 0 25px 20px; text-align: center;">
                        <div style="position: relative; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <img src="${url}" alt="Event Image" style="width: 100%; display: block; height: auto;">
                        </div>
                    </td>
                </tr>`).join('');

                params.image_section = imagesHtml;
            } else {
                params.image_section = '';
            }

            // Handle optional detailed insight section
            if (params.insight) {
                params.insight_section = `
                <tr>
                    <td style="padding: 0 25px 20px;">
                        <div style="background-color: #fce4ec; border-left: 4px solid #e91e63; padding: 15px; border-radius: 4px; color: #880e4f; font-size: 14px;">
                            <strong>Note:</strong> ${params.insight}
                        </div>
                    </td>
                </tr>`;
            } else {
                params.insight_section = '';
            }

            // Default Action Text
            if (!params.action_text) {
                params.action_text = "Book Your Seat";
            }
            // Default Link
            if (!params.link) {
                params.link = "https://savemeaseatzambia.com";
            }

            // Replace placeholders
            Object.keys(params).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                emailHtml = emailHtml.replace(regex, params[key] || '');
            });

            // Clean up remaining placeholders
            emailHtml = emailHtml.replace(/{{[^{}]+}}/g, '');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to,
                    subject,
                    html: emailHtml,
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error("Non-JSON response:", text);
                throw new Error(`Server response error (${response.status}): ${text.substring(0, 100)}...`);
            }

            if (!response.ok) {
                const errorMessage = data.error || data.message || 'Failed to send email';
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }

        if (!response.ok) {
            throw new Error(data.message || 'Failed to send email');
        }

        return data; // { success: true, messageId: ... }
    } catch (error) {
        console.error("Email service error:", error);
        throw error;
    }
};
