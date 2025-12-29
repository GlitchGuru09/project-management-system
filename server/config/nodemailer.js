import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({to, subject, body}) => {
    const response = await transporter.sendMail({
    from: process.env.BREVO_SENDER_EMAIL, // sender address
    to,
    subject,
    html: body, // HTML version of the message
  })
  return response;
};

export default sendEmail;