import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { reset_password_html } from './html/reset-password';
import { verification_email_html } from './html/verify-email';

@Injectable()
export class MailerService {
  from = 'ChatLLmService';
  constructor(
    @Inject('TRANSPORTER') private transporter: nodemailer.Transporter,
  ) {
    this.sendJoinCode = this.sendJoinCode.bind(this);
  }
  sendChangingPasswordCode(body: { mail: string; name: string; code: string }) {
    const to = body.mail;
    const html = reset_password_html(body.code, body.name);
    return this.sendMail({ from: this.from, to, html });
  }
  sendVerifyEmail(body: { mail: string; name: string; code: string }) {
    const to = body.mail;
    const html = verification_email_html(body.code, body.name);
    return this.sendMail({ from: this.from, to, html });
  }
  sendJoinCode(body: {mail: string; name: string; code: string}){
    console.log('sendJoinCodeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    const to = body.mail;
    const html = verification_email_html(body.code, body.name);
    return this.sendMail({ from: this.from, to, html });
  }
  private sendMail(opts: { from: string; to: string; html: string }) {
    return this.transporter.sendMail(opts);
  }
  resetCode() {
    return String(Math.floor(1000 + Math.random() * 8000));
  }
}
