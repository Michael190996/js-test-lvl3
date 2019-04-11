import KoaRouter from 'koa-router';
import mongoose from 'mongoose';
import config from '../config/config';
import {User, Profile, Applications} from '../models';

const router = new KoaRouter();

router.post('/api/user/delete', async (ctx, next) => {
    const {user: LOGIN} = ctx.session;

    if (LOGIN) {
        await Promise.all([
            User.remove({login: LOGIN}),
            Profile.remove({login: LOGIN}),
            Applications.remove({from: LOGIN}),
            mongoose.connection.db.collection('sessions').remove({
                'data.user': LOGIN
            })// todo: заменить на идентификаторы
        ]);
    }

    ctx.session = null;
    ctx.body = {};
});

router.post('/api/user/register', async (ctx, next) => {
    const {
        login: LOGIN,
        password: PASSSWORD,
        firstName: FIRSTNAME,
        lastName: LASTNAME,
        dateOfBirth: DATEOFBIRTH
    } = ctx.request.body;

    try {
        await Promise.all([
            User.create({login: LOGIN, password: PASSSWORD}),
            Profile.create({login: LOGIN, firstName: FIRSTNAME, lastName: LASTNAME, dateOfBirth: new Date(DATEOFBIRTH)})
        ]);
    } catch (err) {
        if (err.code === 11000) {
            ctx.status = 400;
            return next();
        }

        throw new Error(err);
    }

    ctx.body = {};
});

router.post('/api/user/login', async (ctx, next) => {
    const {login: LOGIN, password: PASSSWORD} = ctx.request.body;

    const user = await User.findOne({login: LOGIN});

    if (user && user.checkPassword(PASSSWORD)) {
        ctx.session.user = user.login;
    } else {
        ctx.status = 302;
    }

    ctx.body = {};
});

router.post('/api/user/logout', async (ctx, next) => {
    ctx.session = null;
    ctx.body = {};
});

router.get('/api/user/search', async (ctx, next) => {
    const {q: SEARCH} = ctx.request.body;

    if (SEARCH === undefined) {
        ctx.status = 400;
        ctx.body = {};
        return next()
    }

    ctx.body = await Profile.find({
        $text: {
            $search: SEARCH
        }
    }, {firstName: 1, lastName: 1, login: 1, dateOfBirth: 1, _id: 0});
});

router.get('/api/user/profile/:login', async (ctx, next) => {
    const {login: LOGIN} = ctx.params;

    if (!LOGIN) {
        ctx.status = 400;
        ctx.body = {};
        return next()
    }

    ctx.body = await Profile.findOne({
        login: LOGIN
    }, {firstName: 1, lastName: 1, login: 1, dateOfBirth: 1, _id: 0});
});

router.post('/api/user/applications/create', async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const {message: MESSAGE, to: TO} = ctx.request.body;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    if (LOGIN === TO) {
        return next(new Error(`you are user ${TO}`));
    }

    const USER = await User.findOne({
        login: TO
    }, {login: 1});

    if (!USER) {
        return next(new Error(`user ${TO} of undefined`));
    }

    const APPLICATION = await Applications.updateOne({
        to: LOGIN,
        from: TO
    }, {
        $set: {
            status: true
        }
    });

    if (!APPLICATION.n) {
        await Applications.updateOne({
            to: TO,
            from: LOGIN,
        }, {
            $set: {
                message: MESSAGE
            }
        }, {upsert: true});
    }

    ctx.body = {};
});

router.post('/api/user/applications/reject', async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const {to: TO} = ctx.request.body;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    if (LOGIN === TO) {
        return next(new Error(`you are user ${TO}`));
    }

    const APPLICATION = await Applications.remove({
        to: TO,
        from: LOGIN
    });

    if (!APPLICATION.n) {
        await Applications.updateOne({
            to: LOGIN,
            from: TO,
        }, {
            $set: {
                status: false
            }
        });
    }

    ctx.body = {};
});

router.post('/api/user/applications/resolve', async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const {to: TO} = ctx.request.body;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    if (LOGIN === TO) {
        return next(new Error(`you are user ${TO}`));
    }

    await Applications.updateOne({
        to: LOGIN,
        from: TO,
    }, {
        $set: {
            status: true
        }
    });

    ctx.body = {};
});

router.get(['/api/user/applications/incoming/:p', '/api/user/applications/incoming'], async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const PAGE = ctx.params.p || 0;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    ctx.body = await Applications.find({
        to: LOGIN
    }, {message: 1, to: 1, status: 1, from: 1, _id: 0})
        .skip(PAGE * config.APPLICATIONSONPAGE)
        .limit(config.APPLICATIONSONPAGE);
});

router.get(['/api/user/applications/outgoing/:p', '/api/user/applications/outgoing'], async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const PAGE = ctx.params.p || 0;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    ctx.body = await Applications.find({
        from: LOGIN
    }, {message: 1, to: 1, status: 1, from: 1, _id: 0})
        .skip(PAGE * config.APPLICATIONSONPAGE)
        .limit(config.APPLICATIONSONPAGE);
});

router.get(['/api/user/applications/friends/:p', '/api/user/applications/friends'], async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const PAGE = ctx.params.p || 0;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    ctx.body = await Applications.find({
        status: true,
        $or: [{to: LOGIN}, {from: LOGIN}]
    }, {message: 1, to: 1, status: 1, from: 1, _id: 0})
        .skip(PAGE * config.APPLICATIONSONPAGE)
        .limit(config.APPLICATIONSONPAGE);
});

router.get(['/api/user/applications/all/:p', '/api/user/applications/all'], async (ctx, next) => {
    const {user: LOGIN} = ctx.session;
    const PAGE = ctx.params.p || 0;

    if (!LOGIN) {
        ctx.status = 302;
        return next();
    }

    ctx.body = await Applications.find({
        $or: [{to: LOGIN}, {from: LOGIN}]
    }, {message: 1, to: 1, status: 1, from: 1, _id: 0})
        .skip(PAGE * config.APPLICATIONSONPAGE)
        .limit(config.APPLICATIONSONPAGE);
});

export default router;