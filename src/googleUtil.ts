import { google } from "googleapis";

const googleConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirect: process.env.GOOGLE_SERVER_REDIRECT,
};

function createConnection() {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirect
  );
}

const defaultScope = [
  //   "https://www.googleapis.com/auth/oAuth2.me",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/userinfo.email",
];

function getConnectionUrl(auth) {
  return auth.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: defaultScope,
  });
}

function urlGoogle() {
  const auth = createConnection();
  const url = getConnectionUrl(auth);
  return url;
}

function getGoogleoAuth2Api(auth) {
  return google.oauth2({ version: "v2", auth });
}

async function getGoogleAccountFromCode(code) {
  const auth = createConnection();

  const data = await auth.getToken(code);
  const { tokens } = data;

  auth.setCredentials(tokens);

  const oAuth2 = getGoogleoAuth2Api(auth);
  const me = await oAuth2.userinfo.get({ oauth_token: tokens.access_token });

  const userGoogleId = me.data.id;
  const userGoogleEmail = me.data.email;
  const userGoogleName = me.data.name;

  return {
    id: userGoogleId,
    email: userGoogleEmail,
    name: userGoogleName,
    tokens,
  };
}

export { urlGoogle, getGoogleAccountFromCode };
