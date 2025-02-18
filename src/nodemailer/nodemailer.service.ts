import { Inject, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { joinSessionInvitation } from './html/join-session';

@Injectable()
export class MailerService {
  from = 'ChatLLmService';
  constructor(
    @Inject('TRANSPORTER') private transporter: nodemailer.Transporter,
  ) {}
  sendJoinCode(body: {mail: string; name: string; code: string, sessionId: string}) {
    const to = body.mail;
    const html = joinSessionInvitation(body.code, body.name, body.sessionId);
    return this.sendMail({ from: this.from, to, html });
  }
  private sendMail(opts: { from: string; to: string; html: string }) {
    return this.transporter.sendMail(opts);
  }
  resetCode() {
    return String(Math.floor(1000 + Math.random() * 8000));
  }
}
