/**
 * Modern Email Layout
 * Provides a standard, high-quality structure for all outgoing emails.
 */

export interface LayoutOptions {
  title?: string;
  previewText?: string;
  organizationName?: string;
  organizationLogo?: string;
  organizationColor?: string;
  footerContent?: string;
  unsubscribeUrl?: string;
}

export function wrapInModernLayout(
  content: string,
  options: LayoutOptions = {},
): string {
  const {
    title = "Opttius Notification",
    previewText = "",
    organizationName = "Opttius",
    organizationLogo = "", // URL to logo
    organizationColor = "#1e40af", // Default Opttius Blue
    footerContent = "Este es un mensaje automático, por favor no respondas a este correo.",
    unsubscribeUrl = "#",
  } = options;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>${title}</title>
    <style>
        /* Base Styles */
        body {
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #1e293b;
        }
        
        table { border-collapse: collapse; }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            margin-top: 40px;
            margin-bottom: 40px;
        }
        
        .header {
            padding: 32px 40px;
            background-color: #ffffff;
            border-bottom: 1px solid #f1f5f9;
            text-align: center;
        }
        
        .content {
            padding: 40px;
            line-height: 1.6;
            font-size: 16px;
        }
        
        .footer {
            padding: 32px 40px;
            background-color: #f8fafc;
            text-align: center;
            font-size: 14px;
            color: #64748b;
        }
        
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: ${organizationColor};
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin-top: 24px;
        }
        
        .preview-text {
            display: none;
            max-height: 0px;
            overflow: hidden;
            mso-hide: all;
        }

        h1, h2, h3 { color: #0f172a; margin-top: 0; }
        
        p { margin-bottom: 16px; }
        
        .logo {
            max-height: 48px;
            margin-bottom: 16px;
        }

        @media only screen and (max-width: 600px) {
            .container {
                margin-top: 0;
                margin-bottom: 0;
                border-radius: 0;
                width: 100% !important;
            }
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div class="preview-text">${previewText}</div>
    <div class="container">
        <div class="header">
            ${organizationLogo ? `<img src="${organizationLogo}" alt="${organizationName}" class="logo">` : `<h2 style="margin:0; color:${organizationColor}">${organizationName}</h2>`}
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>${organizationName}</p>
            <p>${footerContent}</p>
            <div style="margin-top: 16px;">
                <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Preferencias de correo</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}
