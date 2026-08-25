const baseUrl = "https://www.nota.ink";
const logoUrl = `${baseUrl}/favicon.svg`;

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #ffffff;
      color: #09090b;
      margin: 0;
      padding: 0;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .logo {
      width: 40px;
      height: 40px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.025em;
      margin-bottom: 16px;
      color: #09090b;
    }
    p {
      font-size: 15px;
      margin-bottom: 24px;
      color: #3f3f46;
    }
    .button {
      display: inline-block;
      background-color: #09090b;
      color: #ffffff;
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      margin-bottom: 24px;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #e4e4e7;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="${logoUrl}" alt="Nota" class="logo" />
    ${content}
    <div class="footer">
      &copy; ${new Date().getFullYear()} Nota. All rights reserved.<br />
      If you did not request this email, you can safely ignore it.
    </div>
  </div>
</body>
</html>
`;

export const getSignupVerificationTemplate = (url: string) =>
	baseTemplate(`
  <h1>Verify your email address</h1>
  <p>Welcome to Nota! Please click the button below to verify your email address and complete your registration.</p>
  <a href="${url}" class="button">Verify Email</a>
  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
  <p style="word-break: break-all; font-size: 13px; color: #71717a;"><a href="${url}" style="color: #09090b;">${url}</a></p>
`);

export const getExistingUserSignupTemplate = () =>
	baseTemplate(`
  <h1>Sign-up attempt with your email</h1>
  <p>We noticed someone tried to create a new Nota account using this email address. Since you already have an account, you can just sign in.</p>
  <a href="${baseUrl}/signin" class="button">Sign In to Nota</a>
`);

export const getPasswordResetTemplate = (url: string) =>
	baseTemplate(`
  <h1>Reset your password</h1>
  <p>We received a request to reset your password. Click the button below to choose a new one.</p>
  <a href="${url}" class="button">Reset Password</a>
  <p>If you didn't request a password reset, you can safely ignore this email.</p>
  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
  <p style="word-break: break-all; font-size: 13px; color: #71717a;"><a href="${url}" style="color: #09090b;">${url}</a></p>
`);
