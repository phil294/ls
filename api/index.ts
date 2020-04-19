/// <reference types="./types/express-form-data" />
import bodyParser from 'body-parser';
import { ValidationError } from 'class-validator';
import express from 'express';
import expressFormData from 'express-form-data';
import { NO_CONTENT, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import 'reflect-metadata';
import authentication_middleware from './authentication-middleware';
import attribute_router from './routers/attribute-router';
import error_router from './routers/error-router';
import authentication_router from './routers/authentication-router';
import product_router from './routers/product-router';
import user_router from './routers/user-router';
import MailService from './services/MailService';
import TokenService from './services/TokenService';
import { env, error, log, html_escape, is_production } from './utils';
import { createConnection } from 'typeorm';

// ///////////////// CONFIG

const mail_service = new MailService(env('MAIL_SENDER_SMTP_HOST'), env('MAIL_SENDER_USER'), env('MAIL_SENDER_PASSWORD'));
const token_service = new TokenService(env('TOKEN_SECRET'));

// ////////////////// ROUTES

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(expressFormData.parse());

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // fixme

    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
        res.sendStatus(NO_CONTENT);
        return;
    }
    log(req.method, req.url);
    // setTimeout(next, 150);
    next();
});

app.use(authentication_middleware(token_service));
app.use('/authentication', authentication_router(
    token_service, mail_service,
    env('WEB_ROOT'), env('GOOGLE_CLIENT_ID'), env('FACEBOOK_APP_ID'), env('FACEBOOK_APP_SECRET'), env('WEBSITE_NAME'),
));
app.use('/user', user_router);
app.use('/error', error_router(mail_service));
app.use('/p', product_router);
app.use('/a', attribute_router);
app.use('/', express.static(__dirname + '/public'));

// @ts-ignore
// Global error fallback handler, including promises
app.use(async (err, req, res, next) => {
    error(err);
    const info = err && (err.stack || err.status || err.errmsg || err.message || err) || 'no error message available';
    if (is_production) {
        // TODO: use system-configured mail instead
        await mail_service.send_mail(
        'error@produpedia.org',
        'API 500 / 422',
        html_escape(JSON.stringify(info)));
    }
    if (err.length && (err[0] instanceof ValidationError || err[0].constraints)) { // TODO: class-validator whitelisting errors arent instanceof ValidationError. Probably a bug?
        // TODO: err doesnt include the stack trace
        return res.status(UNPROCESSABLE_ENTITY).send(err);
    }
    let user_message = 'Internal Server Error';
    if (!is_production)
        user_message += ' - ' + info;
    return res.status(500).send(user_message);
});

(async () => {
    await createConnection();
    const PORT = Number(env('PORT'));
    const HOST = env('HOST');

    app.listen(PORT, HOST, () => log(`running on ${HOST}:${PORT}`));
})().catch((e) => {
    error(e);
    process.exit(1);
});
