import { createMonthlyReport } from './monthlyReport/index.js';
import { CronJob } from 'cron';

export const monthlyJob = new CronJob('0 11 1 * *', async () => {
    console.log('Running monthly job...');
    await createMonthlyReport();
}, null, true, 'UTC');


