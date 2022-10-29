import { Logger, createLogger, transports, format } from 'winston';

const logger: Logger = createLogger({
    level: 'silly',
    format: format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(info => `[ECCO LSP client] ${info.timestamp} ${info.level}: ${info.message}`)
    ),
    transports: [
        new transports.Console()
    ]
});

export default logger;