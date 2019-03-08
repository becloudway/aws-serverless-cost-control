import { createLogger } from 'bunyan';

const log = createLogger({
    name: 'scc',
    level: 'debug',
});

export { log };
