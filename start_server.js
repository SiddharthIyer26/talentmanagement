import { createServer } from 'vite';

async function start() {
  try {
    const server = await createServer({
      configFile: './vite.config.ts',
      server: {
        port: 5173,
        host: '0.0.0.0'
      }
    });
    await server.listen();
    server.printUrls();
    console.log('TALENT_OS_SERVER_RUNNING_SUCCESSFULLY');
  } catch (err) {
    console.error('SERVER_START_ERROR:', err);
  }
}

start();
