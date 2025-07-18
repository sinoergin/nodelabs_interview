import amqp from 'amqplib';
import config from '../common/config/index.js';

let channel;

const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(config.rabbitMQ.uri);
    channel = await connection.createChannel();
    await channel.assertQueue('message_sending_queue', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
  }
};

const getChannel = () => channel;

export { connectRabbitMQ, getChannel };
