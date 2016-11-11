'use strict';

const Code = require('code');
const expect = Code.expect;
const NamiClient = require('../');
const Joi = require('joi');

let clientConfig;
if(!process.env.CODESHIP) {
	clientConfig = require('../config.test.json');
}


describe('NamiClient', () => {

	describe('unit', () => {


		describe('invalid config', () => {

			it('should throw error on missing groupId', () => {

				expect(() => new NamiClient({
					userId: '123',
					password: 'xyz'
				}))
				.to.throw(Joi.ValidationError, 'child "groupId" fails because ["groupId" must be a string]');

			});

			it('should throw error on missing password', () => {

				expect(() => new NamiClient({
					userId: '123',
					groupId: '123'
				}))
				.to.throw(Joi.ValidationError, 'child "password" fails because ["password" must be a string]');

			});

			it('should throw error on missing userId', () => {

				expect(() => new NamiClient({
					password: 'xyz',
					groupId: '123'
				}))
				.to.throw(Joi.ValidationError, 'child "userId" fails because ["userId" must be a string]');

			});

		});



		describe('API', () => {

			let client;
			before(() => client = new NamiClient({
				userId: '123',
				groupId: '456',
				password: 'asdqwe'
			}));

			function shouldHaveMethod(name) {
				it(`should have method: ${name}()`, () => expect(client[name]).to.be.a.function());
			}

			shouldHaveMethod('_authenticate');
			shouldHaveMethod('_extendBaseUrl');

		});



		describe('functional api in dev mode', () => {


			let client;
			before(() => client = new NamiClient({
				userId: '123',
				groupId: '456',
				password: 'asdqwe'
			}));

			it('_extendBaseUrl should return development base url extended with given path', () => {

				let uri = client._extendBaseUrl('/test');

				expect(uri)
					.to.be.a.string()
					.to.equal(client._config.developmentBaseUrl + '/test');

			});


		});



		describe('functional api in production mode', () => {


			let client;
			before(() => client = new NamiClient({
				userId: '123',
				groupId: '456',
				password: 'asdqwe',
				production: true
			}));

			it('_extendBaseUrl should return production base url extended with given path', () => {

				let uri = client._extendBaseUrl('/test');

				expect(uri)
					.to.be.a.string()
					.to.equal(client._config.productionBaseUrl + '/test');

			});




		});


	});








	describe('requests', function() {

		this.timeout(0);


		describe('authentication', () => {

			let client;
			before(() => client = new NamiClient(clientConfig));

			it('should authenticate', () => {

				return client._authenticate().then((res) => expect(res)
					.to.be.an.object()
					.to.equal({ success:true })
				);

			});

		});





		describe('getMembers', () => {

			let client;
			before(() => client = new NamiClient(clientConfig));
			before(() => client._authenticate());


			it('should get members', () => {
				return client.getMembers({ limit: 2 }).then((res) => {

					expect(res)
						.to.be.an.object();

					expect(res.success)
						.to.be.a.boolean()
						.to.equal(true);

					expect(res.totalEntries)
						.to.be.a.number();

					expect(res.data)
						.to.be.an.array()
						.have.length(2);

				});
			});

		});


	});




});
