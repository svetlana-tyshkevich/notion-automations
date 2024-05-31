import { monthlyJob } from '../../src/Schedule.js';

export const handler = () => {
    monthlyJob.start();

    return {
        statusCode: 200,
        body: 'schedule is running'
    }
};