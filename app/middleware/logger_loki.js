import winston from 'winston'
import expressWinston from 'express-winston'
import moment from 'moment';
import  'winston-daily-rotate-file';

export const reqLogLoki= winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: "./logs/%DATE%.log",
            datePattern: "YYYY/MM/DD",
            zippedArchive: true,
            frequency: '24h',
            maxFiles: '5d'
        }),
    ],
    format: winston.format.printf((info) => {
        let stringSave = `timestamp=${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} level=info  type=REQ request_id=${info.message.uuid} ${info.message.string} `
        return stringSave
    }),
    });
export const  resLogLoki = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: "./logs/%DATE%.log",
            datePattern: "YYYY/MM/DD",
            zippedArchive: true,
            frequency: '24h',
            maxFiles: '5d'
        }),
    ],
    format: winston.format.printf((info) => {
        let stringSave = `timestamp=${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} level=success  type=RES request_id=${info.message.uuid} ${info.message.string} `
        return stringSave
    }),
    });

export    const resErrorLogLoki = winston.createLogger({
        transports: [
            new winston.transports.DailyRotateFile({
                filename: "./logs/%DATE%.log",
                datePattern: "YYYY/MM/DD",
                zippedArchive: true,
                frequency: '24h',
                maxFiles: '5d'
            }),
        ],
        format: winston.format.printf((info) => {
            let stringSave = `timestamp=${moment().format('YYYY-MM-DD HH:mm:ss.SSS')} level=error  type=RES request_id=${info.message.uuid} ${info.message.string} `
            return stringSave
        }),
        });