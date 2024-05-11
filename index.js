import http from 'node:http';
import { createMonthlyReport } from './src/monthlyReport/index.js';

const port = 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end();
});

server.listen(port, () => {
    console.log(`Server running at port ${port}`);
});

try {
    await createMonthlyReport();
} catch (e) {
    console.error(e);
}

