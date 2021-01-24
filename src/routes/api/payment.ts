import { getRepository } from "typeorm";

import { stripe } from "../../stripeService";
import { User } from "../../entities/user";

const userRepo = getRepository(User);
const paymentRouter = require("express").Router();

// count
async function chargePayment(req): Promise<boolean> {
  try {
    const user = await userRepo
      .createQueryBuilder("u")
      .where("u.id = :id", { id: req.session.userId })
      .addSelect("u.email")
      .getOne();

    const customer = await stripe.customers.create({
      name: user.username,
      email: user.email,
    });

    const charge = await stripe.charges.create({
      amount: 299,
      currency: "eur",
      customer: customer.id,
    });

    console.log(customer, charge);

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}
paymentRouter.post("/charge", async (req, res) => {
  res.send(await chargePayment(req));
});

async function checkoutSession(req, res): Promise<boolean> {
  const priceId = "price_1IC5YUEWDRtjeSYYF84CSCXM";

  // See https://stripe.com/docs/api/checkout/sessions/create
  // for additional parameters to pass.
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url:
        "https://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://localhost:3000/canceled",
    });

    res.send({
      sessionId: session.id,
    });
  } catch (e) {
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

module.exports = paymentRouter;
