import crypto from 'node:crypto';
import { Resend } from 'resend';
import { Subscriber } from '../models/index.js';
export async function requestSubscription(email) {
  const confirmToken = crypto.randomBytes(32).toString('hex');
  const subscriber = await Subscriber.findOneAndUpdate({ email: email.toLowerCase() }, { status: 'pending', confirmToken }, { upsert: true, new: true });
  if (process.env.RESEND_API_KEY) await new Resend(process.env.RESEND_API_KEY).emails.send({ from: 'Kraviona <newsletter@kraviona.site>', to: email, subject: 'Confirm your Kraviona subscription', html: `<p>Confirm your subscription:</p><p><a href="${process.env.CLIENT_URL}/newsletter/confirm?token=${confirmToken}">Confirm subscription</a></p>` });
  return subscriber;
}
export async function confirmSubscription(token) { return Subscriber.findOneAndUpdate({ confirmToken: token }, { status: 'subscribed', subscribedAt: new Date(), $unset: { confirmToken: 1 } }, { new: true }); }
