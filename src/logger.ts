import { createLogger } from 'bunyan';

const log = createLogger({
    level: 'debug',
    name: 'scc',
});

export { log };
