import chai from 'chai';
import chaiHttp from 'chai-http';
import index from '../src/index';

chai.use(chaiHttp);

describe('Route tests', function () {
    const AUTH = {'login': 'tjhgdjhmgedst', 'password': 'Scrfhdjghjipt'};
    const OTHER = {'login': 'jhghjddjhg', 'password': 'hjjhdjh'};
    const expect = chai.expect;
    const assert = chai.assert;
    let server = null;
    let agent = null;
    let userCookie = null;
    let user2Cookie = null;

    beforeEach(async function () {
        server = await index;
        agent = chai.request.agent(server)
    });

    it('/api/user/login && /api/user/delete', (done) => {
        agent
            .post('/api/user/login')
            .send(AUTH)
            .end((req, res) => {
                try {
                    expect(res).to.have.status(200);
                } catch (err) {
                    console.log(err.toString());
                    return done();
                }

                return agent
                    .post('/api/user/delete')
                    .then(del => expect(del).to.have.status(200))
                    .then(() => done())
                    .catch(err => done(err));
            });
    });

    it('/api/user/register', (done) => {
        const USER = agent
            .post('/api/user/register')
            .send(Object.assign({}, AUTH, {
                firstName: 'михаил',
                lastName: 'басов',
                dateOfBirth: '1996-09-19'
            }))
            .then(res => expect(res).to.have.status(200));

        const USER2 = agent
            .post('/api/user/register')
            .send(Object.assign({}, OTHER, {
                firstName: 'михаил',
                lastName: 'басов',
                dateOfBirth: '1996-09-19'
            }))
            .then((res) => {
                try {
                    expect(res).to.have.status(200);
                } catch (err) {
                    console.log(err);
                    expect(res).to.have.status(400);
                }
            });

            Promise.all([USER, USER2])
                .then(() => done())
                .catch(err => done(err));
    });

    it('/api/user/login', (done) => {
        const USER = agent
            .post('/api/user/login')
            .send(AUTH)
            .then((res) => {
                expect(res).to.have.status(200);
                userCookie = res.headers['set-cookie'];
            });

        const USER2 = agent
            .post('/api/user/login')
            .send(OTHER)
            .then((res) => {
                expect(res).to.have.status(200);
                user2Cookie = res.headers['set-cookie'];
            });

        Promise.all([USER, USER2])
            .then(() => done())
            .catch(err => done(err));
    });

    it('/api/user/applications/create', (done) => {
        agent
            .post('/api/user/applications/create')
            .set('Cookie', userCookie.join(';'))
            .send({message: 'test', to: OTHER.login})
            .then(res => expect(res).to.have.status(200))
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/incoming/:p', (done) => {
        agent
            .get('/api/user/applications/incoming')
            .set('Cookie', user2Cookie.join(';'))
            .then((res) => {
                expect(res).to.have.status(200);
                assert(res.body.data.length, 'applications/incoming of undefined');
            })
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/reject', (done) => {
        agent
            .post('/api/user/applications/reject')
            .set('Cookie', user2Cookie.join(';'))
            .send({to: AUTH.login})
            .then(res => expect(res).to.have.status(200))
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/resolve', (done) => {
        agent
            .post('/api/user/applications/resolve')
            .set('Cookie', user2Cookie.join(';'))
            .send({to: AUTH.login})
            .then(res => expect(res).to.have.status(200))
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/friend/:p', (done) => {
        agent
            .get('/api/user/applications/friends')
            .set('Cookie', userCookie.join(';'))
            .then((res) => {
                expect(res).to.have.status(200);
                assert(res.body.data.length, 'applications/friends of undefined');
            })
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/outgoing/:p', (done) => {
        agent
            .get('/api/user/applications/outgoing')
            .set('Cookie', userCookie.join(';'))
            .then((res) => {
                expect(res).to.have.status(200);
                assert(res.body.data.length, 'applications/outgoing of undefined');
            })
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/applications/all/:p', (done) => {
        agent
            .get('/api/user/applications/all')
            .set('Cookie', userCookie.join(';'))
            .then((res) => {
                expect(res).to.have.status(200);
                assert(res.body.data.length, 'applications/all of undefined');
            })
            .then(() => done())
            .catch(err => done(err))
    });

    it('/api/user/search', (done) => {
        agent
            .get('/api/user/search')
            .send({q: 'михаил басов'})
            .then((res) => {
                expect(res).to.have.status(200);
                assert.isArray(res.body.data, 'body is not array');

                console.log(res.body.data);

                if (res.body.data.find(({firstName, lastName, dateOfBirth}) => {
                    return (firstName === 'михаил' && lastName === 'басов' && +new Date(dateOfBirth) === +new Date('1996-09-19'))
                })) {
                    return done();
                }

                done('element of undefined');
            })
            .catch(err => done(err))
    });

    it('/api/user/profile/:login', (done) => {
        agent
            .get('/api/user/profile/' + AUTH.login)
            .then((res) => {
                expect(res).to.have.status(200);
                assert.isObject(res.body.data, 'body is not object');

                console.log(res.body.data);

                const {
                    firstName: FIRSTNAME,
                    lastName: LASTNAME,
                    dateOfBirth: DATEOFBIRTH
                } = res.body.data;

                assert(
                    FIRSTNAME === 'михаил' || LASTNAME === 'басов' || +new Date(DATEOFBIRTH) === +new Date('1996-09-19'),
                    'element of undefined'
                );

                done();
            })
            .catch(err => done(err))
    });
});