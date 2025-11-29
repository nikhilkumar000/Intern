import crypto from "crypto";

export const generateSecureOtp = () => {
  const buffer = crypto.randomBytes(4); 
  const numericValue = buffer.readUInt32BE(0); 
  const otp = (numericValue % 1000000).toString().padStart(6, "0");
  return otp;
};
