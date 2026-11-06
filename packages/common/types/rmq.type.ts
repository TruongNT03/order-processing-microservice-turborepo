export interface IRabbitMqQueue {
  MAIN: {
    EXCHANGE: string;
    QUEUE: string;
    ROUTING_KEY: string;
  };

  RETRY: {
    EXCHANGE: string;
    QUEUE: string;
    ROUTING_KEY: string;
    TTL: number;
  };

  DLQ: {
    EXCHANGE: string;
    QUEUE: string;
    ROUTING_KEY: string;
  };
}
