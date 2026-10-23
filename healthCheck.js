import db from "./database.js";
import bot from "./index.js";
import { schedule } from "node-cron";
import http from "http";

const PORT = 8000;
var health = 'starting';

async function checkHealth() {
    const dbHealthy = await db.healthCheck();
    const botHealthy = await bot.healthCheck();
    if (dbHealthy === true && botHealthy === true) {
        health = 'healthy';
    } else {
        health = 'unhealthy';
    }
}

async function startHttpServer() {
    const server = http.createServer(async (req, res) => {
        try {
            await checkHealth();
            if (health === 'healthy') {
                res.writeHead(200, {'content-type': 'text/plain'});
            } else if (health === 'unhealthy') {
                res.writeHead(500, {'content-type': 'text/plain'});
            }
            res.end(health);
        } catch {
            res.writeHead(503, {'content-type': 'text/plain'});
            res.end('Error');
        }
    });
    server.listen(PORT, '127.0.0.1', () => {
        console.log('Health check listening on port', PORT);
    });
}

export {startHttpServer};