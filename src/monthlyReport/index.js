import { Client } from '@notionhq/client';
import pkg from 'lodash';

const { uniqBy } = pkg;

let dbPages;
let dbPropertiesData;
let reportTemplateChildren = [];

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

const monthIcon = {
    0: '🔵',
    1: '🔵',
    2: '🟢',
    3: '🟢',
    4: '🟢',
    5: '🟣',
    6: '🟣',
    7: '🟣',
    8: '🟠',
    9: '🟠',
    10: '🟠',
    11: '🔵',
};


const getDatabase = async () => {
    const databaseId = process.env.LEARNING_DB_ID;

    const databaseResponse = await notion.databases.query({
        database_id: databaseId,
        filter: {
            and: [
                {
                    property: 'Current Month Progress',
                    number: {
                        greater_than: 0,
                    },
                },
            ],
        },

    });
    if (databaseResponse?.results.length) {
        dbPages = databaseResponse.results;
        dbPropertiesData = databaseResponse.results.map(item => item.properties);
    }

};

const getPreviousMonthName = () => {
    const currentDate = new Date();
    currentDate.setDate(1);
    currentDate.setDate(0);

    const previousMonth = currentDate.toLocaleString('default', { month: 'long' });
    return previousMonth.charAt(0).toUpperCase() + previousMonth.slice(1);
};

const getPreviousMonthIcon = () => {
    const currentDate = new Date();
    currentDate.setDate(1);
    currentDate.setDate(0);

    return monthIcon[currentDate.getMonth()];
};


const createReportTemplate = async () => {
    const categories = dbPropertiesData.map(item => item.Category.multi_select).flat();

    const categoriesSet = uniqBy(categories, 'name');

    categoriesSet.forEach(cat => {
        reportTemplateChildren.push({
            'object': 'block',
            'heading_2': {
                'rich_text': [
                    {
                        'text': {
                            'content': cat.name,
                        },
                    },
                ],
            },
        });

        const categoryPages = dbPropertiesData.filter(item => item.Category.multi_select.some(obj => obj.name === cat.name));

        categoryPages.forEach(page => {
            reportTemplateChildren.push({
                'object': 'block',
                'paragraph': {
                    'rich_text': [
                        {
                            'text': {
                                'content': `${page['Course name'].title[0].plain_text}: ${Math.round((page.Completed.number - page['Last Month State'].number) / page.Goal.number * 100)}%`,

                            },
                        },
                    ],
                    'color': page.Completed.number === page.Goal.number ? 'purple' : 'default',
                },
            });
        });
    });
};

const saveReport = async () => await notion.pages.create({
    'parent': {
        'type': 'database_id',
        'database_id': process.env.REPORT_DB_ID,
    },
    'properties': {
        'Name': {
            'title': [
                {
                    'text': {
                        'content': getPreviousMonthName(),
                    },
                },
            ],
        },
    },
    'icon': {
        'type': 'emoji',
        'emoji': getPreviousMonthIcon(),
    },
    'children': reportTemplateChildren,
});

const updateFinishedTasksState = async () => {

    const finishedTasks = dbPages.filter(item => item.properties.Status.select && item.properties.Status.select.name === 'Finished');
    const promises = finishedTasks.map(task => {
        return notion.pages.update({
            page_id: task.id,
            properties: {
                'Completed': {
                    number: task.properties.Goal.number,
                },
            },
        });
    });

    await Promise.all(promises);
};

const updateLastMonthState = async () => {

};

export const createMonthlyReport = async () => {
    await getDatabase();
    if (dbPages.length) {
        await updateFinishedTasksState();
        await getDatabase();
        await createReportTemplate();
        await saveReport();
        await updateLastMonthState();
    }
};