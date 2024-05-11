import http from 'node:http';
import { runSchedule } from './src/Schedule.js';

const port = 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end();
});

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});

try {
    runSchedule();
} catch (e) {
    console.error(e);
}

