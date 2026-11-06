import { Inject, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { IRabbitMqQueue, rabbitmqConfiguration, RMQ_QUEUE } from "@repo/common";
import { Channel, ChannelModel } from "amqplib";
import * as amqp from "amqplib";
import { RABBITMQ_CONFIG, RABBITMQ_QUEUE } from "./rabbitmq.constant";
import { ConfigType } from "@nestjs/config";

@Injectable()
export class RmqTopologyService implements OnModuleInit {
  private connection: ChannelModel;
  private channel: Channel;

  constructor(
    @Inject(RABBITMQ_CONFIG)
    private readonly rabbitmqConfig: ConfigType<typeof rabbitmqConfiguration>,
    @Inject(RABBITMQ_QUEUE)
    private readonly config: IRabbitMqQueue,
  ) {}

  async onModuleInit() {
    const logger = new Logger();
    const rabbitmqUrl = `amqp://${this.rabbitmqConfig.user}:${this.rabbitmqConfig.password}@${this.rabbitmqConfig.host}:${this.rabbitmqConfig.port}`;

    this.connection = await amqp.connect(rabbitmqUrl);
    logger.log("Connected to RabbitMQ successfully!");

    this.channel = await this.connection.createChannel();
    logger.log("Create channel in RabbitMQ successfully!");

    await this.setupTopology(this.config);
  }

  private async setupTopology(
    config: (typeof RMQ_QUEUE)[keyof typeof RMQ_QUEUE],
  ) {
    const { MAIN, RETRY, DLQ } = config;

    // Declare exchanges
    await this.channel.assertExchange(MAIN.EXCHANGE, "direct", {
      durable: true,
    });
    await this.channel.assertExchange(RETRY.EXCHANGE, "direct", {
      durable: true,
    });
    await this.channel.assertExchange(DLQ.EXCHANGE, "direct", {
      durable: true,
    });

    // Main queue
    await this.channel.assertQueue(MAIN.QUEUE, {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": RETRY.EXCHANGE,
        "x-dead-letter-routing-key": RETRY.ROUTING_KEY,
      },
    });

    // Retry queue
    await this.channel.assertQueue(RETRY.QUEUE, {
      durable: true,
      arguments: {
        "x-message-ttl": RETRY.TTL,
        "x-dead-letter-exchange": MAIN.EXCHANGE,
        "x-dead-letter-routing-key": MAIN.ROUTING_KEY,
      },
    });

    // DLQ
    await this.channel.assertQueue(DLQ.QUEUE, {
      durable: true,
    });

    // Bind queues
    await this.channel.bindQueue(MAIN.QUEUE, MAIN.EXCHANGE, MAIN.ROUTING_KEY);

    await this.channel.bindQueue(
      RETRY.QUEUE,
      RETRY.EXCHANGE,
      RETRY.ROUTING_KEY,
    );

    await this.channel.bindQueue(DLQ.QUEUE, DLQ.EXCHANGE, DLQ.ROUTING_KEY);
  }
}
