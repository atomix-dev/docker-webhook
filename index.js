const express = require('express');
const rateLimit = require('express-rate-limit');
const { exec } = require('child_process');
require('dotenv').config()

const app = express();

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 8,
});

app.use(express.json());
app.use(limiter);

const DOCKER_PASSWORD = process.env.DOCKER_PASSWORD

const COMMAND = `echo ${DOCKER_PASSWORD} | docker login --username squizy --password-stdin && docker rm bios-uin -f && docker pull squizy/bios-test:latest && docker compose up -d`;

app.post('/webhook', (req, res) => {
  console.log('webhook received');
  const body = req.body;
  console.log(body);

  if (!body || !body.push_data) {
    console.log('no webhook payload');
    return res.status(400).send('Invalid webhook payload')
  }
  if (body && body.push_data.tag === 'latest') {
    const repositoryName = body.repository.repo_name;
    const tag = body.push_data.tag;
    console.log(`New image pushed: ${repositoryName}:${tag}`);

    // Trigger a Kubernetes rollout restart
    const deploymentName = 'bios'; // Update with your Kubernetes deployment name
    exec(COMMAND, (err, stdout, stderr) => {
      if (err) {
        console.error(`Error restarting deployment: ${stderr}`);
        return res.status(500).send('Failed to restart deployment');
      }
      console.log(`Deployment restarted successfully: ${stdout}`);
      res.status(200).send('Deployment restarted');
    });
  } else {
    res.status(400).send('Invalid webhook payload');
  }
});

app.listen(3000, console.log('running on port 3000'));
