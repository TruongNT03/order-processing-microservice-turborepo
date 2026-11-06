export const createRmqQueue = (name: string) => ({
  MAIN: {
    EXCHANGE: `${name}.exchange`,
    QUEUE: `${name}_queue`,
    ROUTING_KEY: name,
  },

  RETRY: {
    EXCHANGE: `${name}.retry.exchange`,
    QUEUE: `${name}_retry_queue`,
    ROUTING_KEY: `${name}.retry`,
    TTL: 10_000,
  },

  DLQ: {
    EXCHANGE: `${name}.dlq.exchange`,
    QUEUE: `${name}_dlq_queue`,
    ROUTING_KEY: `${name}.dlq`,
  },
});
