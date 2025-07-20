import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

const getCurrentDate = () => {
    const now = new Date();
    return (
        now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0')
    );
};

const dateStr = getCurrentDate();

const esTransportOpts = {
    level: 'info',
    clientOpts: {
        node: process.env.ELASTICSEARCH_NODE || 'http://elasticsearch:9200',
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME || '',
            password: process.env.ELASTICSEARCH_PASSWORD || '',
        },
    },
    indexPrefix: 'nodelabs-logs',
    indexSuffixPattern: `-${dateStr}`,
    ensureMappingTemplate: true,
    mappingTemplate: {
        index_patterns: [`nodelabs-logs-*`],
        mappings: {
            properties: {
                timestamp: { type: 'date' },
                level: { type: 'keyword' },
                message: { type: 'text' },
                meta: { type: 'object' },
            },
        },
    },
};

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new ElasticsearchTransport(esTransportOpts),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    );
}

export default logger;
