import { buildApp } from './app.js';
import { config } from './config.js';

const app = buildApp();

app.listen(config.port, () => {
  console.log(`biblio-api escuchando en :${config.port}`);
});
