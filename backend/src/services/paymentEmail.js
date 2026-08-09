import { Resend } from "resend";
import { paymentCredentials } from "./payments.js";
const safe = (value) =>
  String(value || "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export async function sendPaymentEmails({ payment, post, settings }) {
  const credentials = await paymentCredentials();
  if (!credentials.resendApiKey) return;
  const resend = new Resend(credentials.resendApiKey),
    amount = `${payment.currency === "INR" ? "₹" : "$"}${payment.amount / 100}`,
    from = credentials.emailFrom,
    url = `https://kraviona.site/blog/${post.slug}`;
  const jobs = [];
  if (settings.emailReceipt)
    jobs.push(
      resend.emails.send({
        from,
        to: payment.userEmail,
        subject: `Receipt: ${amount} — ${post.title}`,
        html: `<h2>Payment received</h2><p>Thank you for unlocking <strong>${safe(post.title)}</strong>.</p><p>Amount: ${safe(amount)}<br>Order: ${safe(payment.razorpayOrderId)}</p><p><a href="${url}">Read your article</a></p><p>Use ${safe(payment.userEmail)} to restore access on another device.</p>`,
      }),
    );
  if (settings.adminNotify && credentials.adminEmail)
    jobs.push(
      resend.emails.send({
        from,
        to: credentials.adminEmail,
        subject: `New article unlock: ${amount}`,
        html: `<p>${safe(payment.userEmail)} unlocked <strong>${safe(post.title)}</strong>.</p><p>Order: ${safe(payment.razorpayOrderId)}</p>`,
      }),
    );
  await Promise.allSettled(jobs);
}
