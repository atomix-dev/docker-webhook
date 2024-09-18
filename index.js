const express = require('express');
const { exec } = require('child_process');
const { Webhook } = require('@ocktokit/webhooks');
require('dotenv').config();

const app = express();

app.use(express.json());

const DOCKER_PASSWORD = process.env.DOCKER_PASSWORD;

const COMMAND = `echo ${DOCKER_PASSWORD} | docker login --username squizy --password-stdin && docker rm bios-uin -f && docker pull squizy/bios-test:latest && docker run -d --rm --name bios-uin -p 8000:80 --env-file ./.env squizy/bios-test:latest`;

const webhook = new Webhook({
  secret: process.env.WEBHOOK_SECRET
});

app.post('/webhook', async (req, res) => {
  const timestmap = new Date();
  console.log(`${timestmap}: webhook received`);

  const signature = req.headers["x-hub-signature-256"];
  const result = await webhook.verify(req.body, signature);
  if (!result) {
    console.log(`${timestmap}: invalid signature, this is signature from header ${signature}`);
    return res.status(401).send('Invalid signature');
  }

  exec(COMMAND, (error, stdout, stderr) => {
    if (error) {
      console.error(`${timestmap}: Error restarting deployment: ${stderr}`);
      return res.status(500).send('Failed to restart deployment');
    }
    console.log(`${timestmap}: System restart successfully: ${stdout}`)
    return res.status(200).send('system restart successfully');
  });
});

app.listen(3000, console.log('${new Date()}: running on port 3000'));
