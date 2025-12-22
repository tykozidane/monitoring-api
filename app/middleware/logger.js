import winston from 'winston'
import expressWinston from 'express-winston'
import moment from 'moment';
import  'winston-daily-rotate-file';

export const request= expressWinston.logger({
        meta: true,
        // skip: function (req, res) {
        //     if (req.url == '/api/v1/gate/mode-info') return true;
        //     if (req.url == '/redis/message') return true;
        //     if (req.url == '/') return true;
        // },
        transports: [
            new winston.transports.DailyRotateFile({
                filename: "./log-api/%DATE%.log",
                datePattern: "YYYY/MM/DD",
                zippedArchive: true,
                frequency: '24h', 
                maxFiles: '20d'
            }),
        ],
        format: winston.format.printf((info) => {
            var arr = [];
            arr.push(moment().format('YYYY-MM-DD HH:mm:ss.SSS')); //! Timestamp
            arr.push(info.meta.req.headers.idReq); //! ID
            arr.push('REQ'); //! Name
            arr.push(info.meta.req.method); //! Method
            arr.push(info.meta.req.url); //! Url
            arr.push(JSON.stringify(info.meta.req.headers)); //! Headers
            arr.push(JSON.stringify(info.meta.req.body)); //! Request Body
            
            return (arr).join(' | ');
        }),
        requestWhitelist: [...expressWinston.requestWhitelist, 'body', 'idReq', 'ip']
    })
export const  response= expressWinston.logger({
        meta: true,
        skip: function (req, res) {
            if (req.url == '/api/v1/gate/mode-info') return true;
            if (req.url == '/redis/message') return true;
            if (req.url == '/') return true;
        },
        transports: [
            new winston.transports.DailyRotateFile({
                filename: "./log-api/%DATE%.log",
                datePattern: "YYYY/MM/DD",
                zippedArchive: true,
                frequency: '24h', 
                maxFiles: '20d'
            }),
        ],
        format: winston.format.printf((info) => {
            var arr = [];
            arr.push(moment().format('YYYY-MM-DD HH:mm:ss.SSS')); //! Timestamp
            arr.push(info.meta.req.headers.idReq); //! ID
            arr.push('RES'); //! Name
            arr.push(info.meta.req.method); //! Method
            arr.push(info.meta.req.originalUrl); //! Url
            arr.push(`HTTP ${info.meta.res.statusCode}`); //! HTTP Status
            arr.push(`${info.meta.responseTime} ms`); //! Response Time
            arr.push(info.meta.req.ip); //! Remote Address
            arr.push(JSON.stringify(info.meta.res.body)); //! Headers
            
            return (arr).join(' | ')
        }),
        responseWhitelist: [...expressWinston.responseWhitelist, 'body'],
        requestWhitelist: [...expressWinston.requestWhitelist, 'body', 'idReq', 'ip']
    })
