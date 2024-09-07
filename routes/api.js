const {Router} = require("express")
const express = require("express")
const app = Router()
const fs = require('fs');
const path = require('path');
const directoryPath = path.join(__dirname, '../api');
const files = fs.readdirSync(directoryPath);
const api = {};

// Service Infos for endpoints
let service_infos = [];
let service_count = 0;

app.use(express.json());

files.forEach(file => {
  const filePath = path.join(directoryPath, file);
  try {
      if (file.endsWith('.js')) {
        const module = require(filePath);
        const functionName = file.replace('.js', '');
        console.log(`📦 | Yükleyici: ${functionName}.js`)
        api[functionName] = module;
        service_infos[service_count] = `${functionName}`; service_count++;
      }
  } catch(err) {
    const functionName = file.replace('.js', '');
    console.log(`📦 | Yüklenemedi: ${functionName}.js ${err.message}`)
  }
});

app.use((req, res, next) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : req.connection.remoteAddress;
  
  console.log(`📝 | IP: ${clientIp} ${req.method} ${req.url.slice(0, 25)}`);
  next();
});

app.get("/", (req, res) => {
  let services = service_infos;
  services = services.map(x => `api/` + x);
  
  return res.status(200).json({
    "count": (service_count),
    services
  });
});

app.get(`/${service_infos[3]}`, async (req, res) => {
  const timestamp = req.query.timestamp;
  const data = await api.unixdate(timestamp);
  return res.status(data.status).json(data);
});

app.get(`/${service_infos[2]}`, async (req, res) => {
  const text = req.query.text;
  const separator = req.query.separator;
  const index = req.query.index;
  const data = await api.splitter(text, separator, parseInt(index));
  return res.status(data.status).json(data);
});

app.get(`/${service_infos[1]}`, async (req, res) => {
  const repeat = req.query.repeat;
  const message = req.query.message;
  const data = await api.rewrite(repeat, message);
  return res.status(200).json(data);
});

app.post(`/${service_infos[0]}`, async (req, res) => {
  if(req.method !== 'POST') {
    return res.status(400).send(`Sadece post isteği geçerlidir.`);
  }
  
  const { expression } = req.body;
  const data = await api.calculate(expression);
  return res.status(data.status).json(data);
});

app.use((req, res, next) => {
  return res.status(404).send(`404 | Rota Bulunamadı: ${req.originalUrl}`);
});

module.exports = app;
