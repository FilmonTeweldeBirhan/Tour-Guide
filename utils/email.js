const nodemailer = require('nodemailer');

const sendEmail = async (emailOptions) => {
  // 1) Create Transporter
  const transporter = nodemailer.createTransport({
    service: 'hotmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) Create an Option to be used in the email
  const emailOption = {
    from: `Filmon TeweldeBirhan <${process.env.EMAIL_PASSWORD}>`,
    to: emailOptions.email,
    subject: emailOptions.subject,
    text: emailOptions.message,
  };

  // 3) Then At last send the email it self
  await transporter.sendMail(emailOption);
};

module.exports = sendEmail;
