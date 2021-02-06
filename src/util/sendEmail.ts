import nodemailer from "nodemailer";

export async function sendEmail(to: string, html: string) {
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: "mh3hfz7aqzyttcru@ethereal.email",
      pass: "6An7Npw3UUsRGZsAVQ",
    },
  });

  const info = await transporter.sendMail({
    from: '"CaliMentor" <support@calimentor.com>',
    to,
    subject: "Change Password - CaliMentor",
    html,
  });

  console.log("Message sent: %s", info.messageId);

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
