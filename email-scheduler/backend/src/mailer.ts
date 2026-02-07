import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

export async function getEtherealTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  const user = process.env.ETHEREAL_USER;
  const pass = process.env.ETHEREAL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user, pass },
    });
    return transporter;
  }

  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass },
  });
  console.log("[Ethereal] Using auto-created test account:", account.user);
  return transporter;
}

export interface SendMailOptions {
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendMail(opts: SendMailOptions): Promise<{ messageId: string }> {
  const transport = await getEtherealTransporter();
  const info = await transport.sendMail({
    from: opts.from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text ?? opts.html ?? "",
    html: opts.html,
  });
  return { messageId: info.messageId };
}
