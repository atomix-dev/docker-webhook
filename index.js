import express, { json } from 'express';
import { exec } from 'child_process';
import { Webhooks } from '@octokit/webhooks';
import { configDotenv } from 'dotenv';
configDotenv()

const app = express();

app.use(json());

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
  const result = webhook.verify(req.body, signature);
  if (!result) {console.log(`${timestamp}: invalid signature, this is signature from header ${signature}`);
    return res.status(401).send('Invalid signature');
  }

  exec(COMMAND, (error, stdout, stderr) => {
    if (error) {
      console.error(`${timestamp}: Error restarting deployment: ${stderr}`);
      return res.status(500).send('Failed to restart deployment');
    }
    console.log(`${timestamp}: System restart successfully: ${stdout}`)
    return res.status(200).send('system restart successfully');
  });
});

app.listen(3000, console.log(`${new Date()}: running on port 3000`));
