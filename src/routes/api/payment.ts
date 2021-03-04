import { getRepository } from "typeorm";

import { stripe } from "../../stripeService";
import { User } from "../../entities/user";
import { Earning } from "../../entities/earning";

const userRepo = getRepository(User);
const earningRepo = getRepository(Earning);
const paymentRouter = require("express").Router();

// async function chargePayment(req): Promise<boolean> {
//   try {
//     const user = await userRepo
//       .createQueryBuilder("u")
//       .where("u.id = :id", { id: req.session.userId })
//       .addSelect("u.email")
//       .getOne();

//     const customer = await stripe.customers.create({
//       name: user.username,
//       email: user.email,
//     });

//     const charge = await stripe.charges.create({
//       amount: 199,
//       currency: "eur",
//       customer: customer.id,
//     });

//     console.log(customer, charge);

//     return true;
//   } catch (err) {
//     console.log(err);
//     return false;
//   }
// }
// paymentRouter.post("/charge", async (req, res) => {
//   res.send(await chargePayment(req));
// });

async function checkoutSession(req, res): Promise<boolean> {
  // const priceId = "price_1IH6NdEWDRtjeSYYghz2U36X";

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.

  try {
    const user = await userRepo.findOne(req.session.userId);
    let customerId = null;
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
      });
      user.stripeCustomerId = customer.id;
      await userRepo.save(user);
      customerId = customer.id;
    } else {
      customerId = user.stripeCustomerId;
    }

    let session = null;
    const { months } = req.body;
    if (req.body.method === "Single") {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "payment",
        payment_method_types: [
          "card",
          "sepa_debit",
          "ideal",
          "alipay",
          "bancontact",
          "eps",
          "giropay",
          "p24",
          "sofort",
        ],
        line_items: [
          {
            price: process.env.STRIPE_PRODUCT_SINGLE,
            quantity: months,
          },
        ],
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        success_url: `${process.env.URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL}/payment/canceled`,
      });
    } else if (req.body.method === "Subscription") {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: process.env.STRIPE_PRODUCT_SUBSCRIPTION,
            quantity: 1,
          },
        ],
        // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
        success_url: `${process.env.URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.URL}/upgrade`,
      });
    }

    if (session) {
      res.send({
        sessionId: session.id,
      });
    } else {
      res.send(404);
    }
  } catch (e) {
    console.log(e);
    res.status(400);
    return res.send({
      error: {
        message: e.message,
      },
    });
  }
}
paymentRouter.post("/create-checkout-session", async (req, res) => {
  res.send(await checkoutSession(req, res));
});

async function success(req, res) {
  const { object } = req.body.data;

  if (object.status !== "succeeded") {
    console.log("failed");

    return 400;
  }

  try {
    const months = object.amount / 199;

    const user = await userRepo.findOne({ stripeCustomerId: object.customer });
    if(!user){
      return 400;
    }
    if (user.paymentMethod === "None") {
      user.paymentMethod = "Single";
    }

    let date = new Date();
    const premiumExpireDate = new Date(user.premiumExpireDate);
    if (premiumExpireDate > date) {
      date = premiumExpireDate;
    }
    date.setMonth(date.getMonth() + months);

    user.premiumExpireDate = date;
    user.type = "premium";
    await userRepo.save(user);

    //Add earnings
    for (let m = 0; m < months; m++) {
      const mDate = new Date();
      mDate.setMonth(mDate.getMonth() + m);
      const fullDate =
        // eslint-disable-next-line prefer-template
        mDate.getFullYear().toString() +
        "-" +
        (mDate.getMonth() + 1).toString();

      // eslint-disable-next-line no-await-in-loop
      const earning = await earningRepo.findOne({ where: { month: fullDate } });
      if (earning) {
        earning.earnings += 1.99;
        // eslint-disable-next-line no-await-in-loop
        await earningRepo.save(earning);
      } else {
        const newEarning = new Earning();
        newEarning.month = fullDate;
        newEarning.earnings = 1.99;
        // eslint-disable-next-line no-await-in-loop
        await earningRepo.save(newEarning);
      }
    }
  } catch (e) {
    console.log(e);
    return 400;
  }

  return 200;
}
paymentRouter.post("/success", async (req, res) => {
  res.sendStatus(await success(req, res));
});

async function successSubscription(req, res) {
  const { object } = req.body.data;

  const user = await userRepo.findOne({ stripeCustomerId: object.customer });
  user.paymentMethod = "Subscription";
  await userRepo.save(user);

  return 200;
}
paymentRouter.post("/subscription/success", async (req, res) => {
  res.sendStatus(await successSubscription(req, res));
});

async function paidSubscription(req, res) {
  const { object } = req.body.data;

  const user = await userRepo.findOne({ stripeCustomerId: object.customer });
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  await userRepo.save(user);

  return 200;
}
paymentRouter.post("/subscription/paid", async (req, res) => {
  res.sendStatus(await paidSubscription(req, res));
});

async function cancelSubscription(req, res) {
  const user = await userRepo.findOne(req.session.userId);

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
    });

    if (subscriptions.data.length >= 1) {
      await stripe.subscriptions.del(subscriptions.data[0].id);
    }
  } catch (e) {
    console.log(e);
    return 400;
  }

  user.type = "canceled";
  user.paymentMethod = "None";
  await userRepo.save(user);

  return 200;
}
paymentRouter.post("/subscription/cancel", async (req, res) => {
  res.sendStatus(await cancelSubscription(req, res));
});

module.exports = paymentRouter;
