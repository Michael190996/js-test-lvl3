import Koa from 'koa';
import koaRes from 'koa-res';
import koaBodyparser from 'koa-bodyparser';
import KoaSessionMongoose from 'koa-session-mongoose';
import koaSession from 'koa-session';
import mongoose from 'mongoose';
import router from './routes/routes';
import config from './config/config';

export default (async () => {
    mongoose.Promise = global.Promise;
    mongoose.set('debug', !config.PROD);
    mongoose.set('useCreateIndex', true);

    const koa = new Koa();

    const connection = await mongoose.connect(config.MONGO);

    koa.keys = config.SECRET;

    koa
        .use(koaSession({
            store: new KoaSessionMongoose({
                collection: 'sessions',
                connection: connection,
                expires: 86400
            })
        }, koa))
        .use(koaBodyparser())
        .use(koaRes({ debug: !config.PROD }))
        .use(router.routes())
        .use(router.allowedMethods());

    return koa.listen(config.KOAPORT, () => {
        console.log('app', `Server start at localhost:${config.KOAPORT}`);
    });
})();