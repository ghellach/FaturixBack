import express from 'express';
import morgan from 'morgan';
import * as config from './config/config.js'
import router from './router/main.js';

const app = express();
app.use(morgan("dev"));
app.use(express.json());

await config.env();
await config.db();
await config.httpConnection(app);

app.use(router)