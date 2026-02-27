export const EMAIL_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; margin-top: 20px; margin-bottom: 20px; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <tr>
            <td style="padding: 25px 20px; text-align: left;">
                <h1 style="color: #6c5ce7; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Save Me A Seat <span style="font-weight: 300; color: #2d3436;">Zambia</span></h1>
            </td>
        </tr>

        <tr>
            <td style="padding: 0 25px 25px 25px;">
                <h2 style="font-size: 34px; font-weight: 800; color: #2d3436; margin: 0 0 15px 0; line-height: 1.1;">{{title}}</h2>
                <div style="font-size: 15px; color: #636e72; line-height: 1.6; margin-bottom: 25px;">
                    {{message}}
                </div>
                <div style="margin-top: 20px;">
                    <a href="{{link}}" style="background-color: #6c5ce7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;">{{action_text}}</a>
                </div>
            </td>
        </tr>
        
        {{insight_section}}

        {{image_section}}

        <tr>
            <td style="padding: 30px 0; text-align: center;">
                <span style="height: 10px; width: 10px; background-color: #a29bfe; display: inline-block; border-radius: 50%; margin: 0 4px;"></span>
                <span style="height: 10px; width: 10px; background-color: #6c5ce7; display: inline-block; border-radius: 50%; margin: 0 4px;"></span>
                <span style="height: 10px; width: 10px; background-color: #00cec9; display: inline-block; border-radius: 50%; margin: 0 4px;"></span>
            </td>
        </tr>

        <tr>
            <td style="padding: 0 25px 40px 25px; text-align: center;">
                <h3 style="font-size: 18px; color: #2d3436; margin-bottom: 25px;">Ready to host? Choose your event type.</h3>
                <table width="100%" cellspacing="8" cellpadding="0" border="0">
                    <tr>
                        <td width="50%"><a href="https://savemeaseatzambia.com" style="display: block; border: 2px solid #6c5ce7; color: #6c5ce7; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center;">Wedding</a></td>
                        <td width="50%"><a href="https://savemeaseatzambia.com" style="display: block; border: 2px solid #6c5ce7; color: #6c5ce7; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center;">Bridal Shower</a></td>
                    </tr>
                    <tr>
                        <td width="50%"><a href="https://savemeaseatzambia.com" style="display: block; border: 2px solid #6c5ce7; color: #6c5ce7; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center;">Birthday</a></td>
                        <td width="50%"><a href="https://savemeaseatzambia.com" style="display: block; border: 2px solid #6c5ce7; color: #6c5ce7; padding: 14px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; text-align: center;">Corporate</a></td>
                    </tr>
                </table>
            </td>
        </tr>

        <tr>
            <td style="background-color: #fcfcfc; padding: 40px 25px; border-top: 1px solid #eeeeee; color: #b2bec3; font-size: 12px; text-align: left;">
                <p style="margin-bottom: 20px; font-weight: bold; color: #636e72;">Connect with us</p>
                
                <div style="margin-bottom: 35px;">
                    <a href="https://savemeaseatzambia.com" style="color: #ffffff; background-color: #2d3436; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-right: 15px; margin-bottom: 15px; vertical-align: middle;">Visit Website</a>
                    
                    <a href="https://wa.me/260960968349" style="color: #ffffff; background-color: #25D366; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block; margin-bottom: 15px; vertical-align: middle;">
                        <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="16" height="16" style="display: inline-block; vertical-align: middle; margin-right: 8px; border:0; outline:none; text-decoration:none;" alt="WA">
                        <span style="display: inline-block; vertical-align: middle;">Chat on WhatsApp</span>
                    </a>
                </div>
                
                <p style="margin: 0; font-weight: bold; color: #636e72;">Save Me A Seat Zambia</p>
                <p style="margin: 4px 0;">Lusaka, Zambia</p>
                <p style="margin: 4px 0;">© 2026 SaveMeASeatZambia</p>

                <p style="margin-top: 25px; border-top: 1px solid #eeeeee; padding-top: 20px;">
                    <a href="https://savemeaseatzambia.com/privacy" style="color: #6c5ce7; text-decoration: none;">Privacy policy</a> | 
                    <a href="#" style="color: #6c5ce7; text-decoration: none;">Unsubscribe</a> | 
                    <a href="#" style="color: #6c5ce7; text-decoration: none;">Contact Support</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>`;