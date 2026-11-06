import { RmqOptions, KafkaOptions, Transport } from "@nestjs/microservices";

export const getRmqUrl = (env: NodeJS.ProcessEnv = process.env): string => {
  if (env.RABBITMQ_URL) return env.RABBITMQ_URL;
  const user = env.RABBITMQ_USER ?? "admin";
  const pass = env.RABBITMQ_PASS ?? "admin123";
  const host = env.RABBITMQ_HOST ?? "localhost";
  const port = env.RABBITMQ_PORT ?? "5673";
  return `amqp://${user}:${pass}@${host}:${port}`;
};

export interface RmqFactoryOptions {
  queue: string;
  noAck?: boolean;
  prefetchCount?: number;
  env?: NodeJS.ProcessEnv;
}

export const buildRmqOptions = (opts: RmqFactoryOptions): RmqOptions => {
  const env = opts.env ?? process.env;

  return {
    transport: Transport.RMQ,
    options: {
      urls: [getRmqUrl(env)],
      queue: opts.queue,
      noAck: opts.noAck ?? false,
      prefetchCount: opts.prefetchCount ?? 10,
      noAssert: true,
    },
  };
};

export const getKafkaBrokers = (
  env: NodeJS.ProcessEnv = process.env,
): string[] => {
  const brokers = env.KAFKA_BROKERS ?? "localhost:9092";
  return brokers.split(",").map((b) => b.trim());
};

export interface KafkaFactoryOptions {
  clientId: string;
  groupId: string;
  env?: NodeJS.ProcessEnv;
}

export const buildKafkaOptions = (opts: KafkaFactoryOptions): KafkaOptions => {
  const env = opts.env ?? process.env;
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: opts.clientId,
        brokers: getKafkaBrokers(env),
      },
      consumer: {
        groupId: opts.groupId,
        allowAutoTopicCreation: true,
      },
      producer: {
        allowAutoTopicCreation: true,
      },
    },
  };
};
