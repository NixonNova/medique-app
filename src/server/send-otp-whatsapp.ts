type OtpIdResponse = {
  success?: boolean;
  data?: {
    status?: string;
    failure?: {
      message?: string;
    };
  };
  error?: {
    message?: string;
  };
};

export async function sendOtpWhatsApp(phoneNumber: string, otp: string) {
  const apiKey = process.env.OTP_ID_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('WhatsApp belum dikonfigurasi');
  }

  const destination = phoneNumber.replace(/\D/g, '');
  if (!destination.startsWith('62')) {
    throw new Error('Nomor harus nomor Indonesia (62).');
  }
  const response = await fetch('https://api.otp.id/v3/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: 'whatsapp',
      destination,
      otp,
      brand: 'Medique',
      ttl: 300,
    }),
  });

  const payload = (await response.json().catch(() => null)) as OtpIdResponse | null;
  if (!response.ok || !payload || payload.success === false) {
    throw new Error(payload?.error?.message || 'WhatsApp gagal dikirim');
  }
  if (payload?.data?.status === 'failed') {
    throw new Error(payload.data.failure?.message || 'WhatsApp gagal dikirim');
  }
}
