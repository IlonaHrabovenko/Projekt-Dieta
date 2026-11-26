import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// 1. Najpierw ładujemy zmienne z .env
dotenv.config();

// Debugowanie (zobaczysz w konsoli czy klucze się wczytały)
console.log('MAILJET_USER loaded:', process.env.MAILJET_USER ? 'TAK' : 'NIE');
console.log('MAILJET_PASS loaded:', process.env.MAILJET_PASS ? 'TAK' : 'NIE');

export const transporter = nodemailer.createTransport({
  host: process.env.MAILJET_HOST || 'in-v3.mailjet.com',
  port: Number(process.env.MAILJET_PORT) || 587,
  auth: {
    user: process.env.MAILJET_USER,
    pass: process.env.MAILJET_PASS,
  },
});