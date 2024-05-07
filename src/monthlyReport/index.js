import { Client } from '@notionhq/client';
import pkg from 'lodash';

const { uniqBy } = pkg;

let db;

const notion = new Client({
    auth: process.env.NOTION_TOKEN,
});

export const getDatabase = async () => {
    const databaseId = process.env.LEARNING_DB_ID;

    const response = await notion.databases.query({
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

    if (response?.results.length) {
        db = response.results.map(item => item.properties);
        await createReport();
    }

};

const getPreviousMonthName = () => {
    const currentDate = new Date();
    currentDate.setDate(1);
    currentDate.setDate(0);

    const previousMonth = currentDate.toLocaleString('default', { month: 'long' });
    return previousMonth.charAt(0).toUpperCase() + previousMonth.slice(1);
};


const createReport = async () => {
    const categories = db.map(item => item.Category.multi_select).flat();

    const categoriesSet = uniqBy(categories, 'name');
    console.log(categoriesSet);

    const blockChildren = [];
    categoriesSet.forEach(cat => {
        blockChildren.push({
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
        const categoryPages = db.filter(item => item.Category.multi_select.includes(cat));
        categoryPages.forEach(page => {
            blockChildren.push({
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
    const response = await notion.pages.create({
        'parent': {
            'type': 'database_id',
            'database_id': '28f1093683cc414b9213ba2614b3670d',
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
        'children': blockChildren,
    });

};