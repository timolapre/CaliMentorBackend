const SibApiV3Sdk = require("sib-api-v3-sdk");

const defaultClient = SibApiV3Sdk.ApiClient.instance;

const apiKey = defaultClient.authentications["api-key"];
apiKey.apiKey = process.env.EMAIL_API_KEY;

// Uncomment below two lines to configure authorization using: partner-key
// const partnerKey = defaultClient.authentications['partner-key'];
// partnerKey.apiKey = 'YOUR API KEY';

export async function sendEmail(to: string, token: string) {
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

  let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); // SendSmtpEmail | Values to send a transactional email

  sendSmtpEmail = {
    to: [
      {
        email: to,
      },
    ],
    templateId: 1,
    params: {
      URL: process.env.URL,
      TOKEN: token,
    },
    // headers: {
    //   "X-Mailin-custom":
    //     "custom_header_1:custom_value_1|custom_header_2:custom_value_2",
    // },
  };

  apiInstance.sendTransacEmail(sendSmtpEmail).then(
    function (data) {
      console.log(data);
    },
    function (error) {
      console.error(error);
    }
  );
}

// export async function sendEmail(to: string, html: string) {
//   console.log(process.env.EMAIL_USER);

//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 587,
//     secure: false,
//     requireTLS: true,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   const info = await transporter.sendMail({
//     from: '"CaliMentor" <support@calimentor.com>',
//     to,
//     subject: "Change Password - CaliMentor",
//     html,
//   });

//   console.log("Message sent: %s", info.messageId);

//   console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
// }
