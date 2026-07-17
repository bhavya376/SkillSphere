import nodemailer from "nodemailer";

/**
 * Creates and returns a configured Nodemailer transporter.
 * All credentials are read from server/.env — never hardcoded here.
 */
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD || process.env.EMAIL_PASS;

  console.log(`[EMAIL] SMTP configuration loading... (Host: ${host}, User configured: ${user ? "YES" : "NO"}, Password configured: ${pass ? "YES" : "NO"})`);

  const transportConfig = {
    auth: {
      user,
      pass,
    },
  };

  if (host === "smtp.gmail.com" || host.includes("gmail.com")) {
    transportConfig.service = "gmail";
  } else {
    transportConfig.host = host;
    transportConfig.port = parseInt(process.env.EMAIL_PORT || "587", 10);
    transportConfig.secure = process.env.EMAIL_SECURE === "true";
  }

  const transporter = nodemailer.createTransport(transportConfig);

  // Safely verify SMTP transport connection on creation
  transporter.verify((error) => {
    if (error) {
      console.error("[EMAIL] SMTP connection verification FAILED:", error.message);
    } else {
      console.log("[EMAIL] SMTP Transport verified successfully.");
    }
  });

  return transporter;
};

/**
 * Send the OTP verification email to a newly registered user.
 *
 * @param {string} toEmail        - Recipient email address
 * @param {string} recipientName  - Display name for personalisation
 * @param {string} otp            - Plaintext 6-digit OTP (NOT stored server-side as plaintext; only transmitted here)
 */
export const sendVerificationOTP = async (toEmail, recipientName, otp) => {
  const transporter = createTransporter();

  const year = new Date().getFullYear();

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your SkillSphere account</title>
  <style>
    body  { font-family: 'Inter', Arial, sans-serif; background: #0f0f0f; color: #e2e8f0; margin: 0; padding: 0; }
    .wrap { max-width: 540px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d5e; }
    .hdr  { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 36px 40px; text-align: center; }
    .hdr h1 { margin: 0; font-size: 26px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .hdr p  { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.8); }
    .body { padding: 36px 40px; }
    .greeting { font-size: 16px; font-weight: 600; margin: 0 0 12px; }
    .msg  { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 28px; }
    .box  { background: #0f172a; border: 2px solid #6366f1; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px; }
    .lbl  { font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; color: #64748b; margin: 0 0 10px; }
    .code { font-size: 44px; font-weight: 900; letter-spacing: 0.2em; color: #a5b4fc; font-family: 'Courier New', monospace; margin: 0; }
    .exp  { font-size: 12px; color: #64748b; margin: 10px 0 0; }
    .sec  { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 14px 18px; font-size: 12.5px; color: #fca5a5; line-height: 1.6; }
    .ftr  { border-top: 1px solid #2d2d5e; padding: 20px 40px; text-align: center; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="hdr">
      <h1>&#x26A1; SkillSphere</h1>
      <p>Hyperlocal Gig Economy Platform</p>
    </div>
    <div class="body">
      <p class="greeting">Hello, ${recipientName}!</p>
      <p class="msg">
        Welcome to SkillSphere! To complete your account registration and activate your
        profile, please enter the one-time verification code below.
      </p>
      <div class="box">
        <p class="lbl">Your Verification Code</p>
        <p class="code">${otp}</p>
        <p class="exp">&#x23F0; Expires in <strong>10 minutes</strong></p>
      </div>
      <div class="sec">
        &#x26A0;&#xFE0F; <strong>Security Notice:</strong> If you did not create a SkillSphere account,
        please ignore this email. Never share this code with anyone — SkillSphere staff will never ask for it.
      </div>
    </div>
    <div class="ftr">
      &copy; ${year} SkillSphere. This is an automated message — please do not reply.
    </div>
  </div>
</body>
</html>
`;

  console.log(`[OTP] Verification email send attempted for ${toEmail}`);
  try {
    const info = await transporter.sendMail({
      from: `"SkillSphere" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "Verify your SkillSphere email address",
      html: htmlBody,
      text: `Hello ${recipientName},\n\nYour SkillSphere email verification code is: ${otp}\n\nThis code expires in 10 minutes. If you did not register on SkillSphere, please ignore this email.\n\n-- SkillSphere Team`,
    });
    console.log(`[EMAIL] Verification email accepted by SMTP. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[EMAIL] Failed to send verification email:`, error.message);
    throw error;
  }
};
