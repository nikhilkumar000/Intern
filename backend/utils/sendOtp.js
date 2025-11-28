const sendEmailOtp = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Your Login OTP",
    html: `<h1>Your OTP is: <b>${otp}</b></h1>
           <p>OTP expires in 5 minutes.</p>`,
  });
};

export default sendEmailOtp