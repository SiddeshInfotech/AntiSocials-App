export function generateOtp(length = 6): string {
  let otp = "";

  for (let i = 0; i < length; i += 1) {
    otp += Math.floor(Math.random() * 10).toString();
  }

  return otp;
}

export function getOtpExpiryDate(minutes: number): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export function getCooldownThreshold(seconds: number): Date {
  return new Date(Date.now() - seconds * 1000);
}
