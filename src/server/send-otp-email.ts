export async function sendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email is not configured');
    }
    console.info(`[medique] OTP for ${email}: ${otp}`);
    return;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Kode masuk Medique',
      text: `Kode OTP Anda: ${otp}\nKode ini berlaku selama 5 menit.`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`[medique] Resend rejected the message (${response.status}): ${detail}`);
    throw new Error('Email gagal dikirim');
  }
}
