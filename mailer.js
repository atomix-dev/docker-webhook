import { createTransport } from 'nodemailer';
import { configDotenv } from 'dotenv';

configDotenv()

const transporter = createTransport({
  host: process.env.SMTP_HOST,
  port: SMTP_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
})

export default transporter