import express, { json } from 'express';
import { exec } from 'child_process';
import { Webhooks } from '@octokit/webhooks';
import { configDotenv } from 'dotenv';
import transporter from './mailer.js';
configDotenv()

const app = express();

app.use(express.json());

const DOCKER_PASSWORD = process.env.DOCKER_PASSWORD;

const COMMAND = `echo ${DOCKER_PASSWORD} | docker login --username squizy --password-stdin && docker rm bios-uin -f && docker pull squizy/bios-uinril:latest && docker run -d --rm --name bios-uin -p 8000:80 --env-file ./.env squizy/bios-uinril:latest`;

const webhook = new Webhooks({
  secret: process.env.WEBHOOK_SECRET
});


app.post('/webhook', async (req, res) => {
  const timestamp = new Date();
  console.log(`${timestamp}: webhook received`);
  console.log(`${timestamp}: req.body: ${req.body}`);

  const signature = req.headers["x-hub-signature-256"];
  const result = webhook.verify(JSON.stringify(req.body), signature);
  if (!result) {
    console.log(`${timestamp}: invalid signature, this is signature from header ${signature}`);
    return res.status(401).send('Invalid signature');
  } else {
    res.send(200)
  }

  exec(COMMAND, (error, stdout, stderr) => {
    if (error) {
      console.error(`${timestamp}: Error restarting deployment: ${stderr}`);
      transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER,
        subject: 'BIOS Restarting Deployment Status: Fail',
        html: `
          <h2>Restarting Fail</h2>
          <hr>
          <p>Webhook received successfully, but the restarting is failed</p>
          <p>check server log for more info</p>
        `
      })
      return
    }
    console.log(`${timestamp}: System restart successfully: ${stdout}`)
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'BIOS Restarting Deployment Status: Success',
      html: `
        <h2>Restarting Success</h2>
        <hr>
        <p>System restart succesfully</p>
      `
    })
    return
  });
});

app.listen(3000, console.log(`${new Date()}: running on port 3000`));
