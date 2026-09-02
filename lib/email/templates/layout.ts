// Base email layout with Vibed branding

export function emailLayout(content: string, preheader?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Vibed</title>
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #F4F4F1;
      color: #0E0E0E;
    }
    .container {
      max-width: 580px;
      margin: 0 auto;
      padding: 24px 16px;
    }
    .card {
      background: #FFFFFF;
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 16px;
      border: 1px solid #E4E4E1;
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #E4E4E1;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #0E0E0E;
      text-decoration: none;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #8A8A8A;
      padding-top: 20px;
    }
    .footer a {
      color: #8A8A8A;
      text-decoration: underline;
    }
    .btn {
      display: inline-block;
      background: #05CE78;
      color: #00301E !important;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid #E4E4E1;
      color: #0E0E0E !important;
    }
    h1, h2, h3 {
      margin: 0 0 12px 0;
      font-weight: 700;
    }
    p {
      margin: 0 0 16px 0;
      line-height: 1.6;
      color: #565656;
    }
    .venture-card {
      border: 1px solid #E4E4E1;
      border-radius: 10px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .venture-name {
      font-weight: 700;
      font-size: 16px;
      color: #0E0E0E;
      margin-bottom: 4px;
    }
    .venture-pitch {
      font-size: 14px;
      color: #565656;
      margin-bottom: 8px;
    }
    .tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .tag-go { background: #E6F9F0; color: #017A4C; }
    .tag-warn { background: #FBF1DE; color: #B7791F; }
    .tag-heat { background: #EEE9FB; color: #5A2EC4; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="https://vibed.app" class="logo">Vibed</a>
    </div>
    ${content}
    <div class="footer">
      <p>
        <a href="https://vibed.app">Vibed</a> — follow founders from week one
      </p>
      <p>
        <a href="https://vibed.app/settings">Manage email preferences</a> ·
        <a href="https://vibed.app/privacy">Privacy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;
}
