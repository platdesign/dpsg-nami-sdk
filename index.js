'use strict';


const request = require('request');
const Hoek = require('hoek');
const Joi = require('joi');


const configSchema = Joi.object().keys({
	groupId: Joi.string().required(),
	userId: Joi.string().required(),
	password: Joi.string().required(),
	production: Joi.boolean().required(),
	productionBaseUrl: Joi.string().uri({	scheme: ['https'] }).required(),
	developmentBaseUrl: Joi.string().uri({ scheme: ['https', 'http'] }).required(),
	appApiBasePath: Joi.string().required(),
	apiBasePath: Joi.string().required()
});







module.exports = class NamiSDK {



	/**
	 * Class constructor
	 * @param {String} config.groupId 		Stammesnummer
	 * @param {String} config.userId 			Mitgliedsnummer eines Users mit API-Berechtigung
	 * @param {String} config.password 		Passwort des Users
	 * @param {Boolean} config.production if true nami.dpsg.de will be requested instead of namitest.dpsg.de
	 */
	constructor(config) {

		// Default config parameters
		const configDefaults = {
			production: false,
			groupId: null,
			userId: null,
			password: null,
			productionBaseUrl: 'https://nami.dpsg.de',
			developmentBaseUrl: 'https://namitest.dpsg.de',
			appApiBasePath: '/ica/rest/nami',
			apiBasePath: '/ica/test/api'
		};


		// create config based con defaults and given config
		config = Hoek.applyToDefaults(configDefaults, config);


		// validate config object with joi-configSchema
		const validationResult = Joi.validate(config, configSchema, {
			convert: true
		});


		// Throw error in case of invalid config
		if(validationResult.error) {
			throw validationResult.error;
		}

		// Assign validated/sanitized validationResult (config-object) to client instance
		this._config = validationResult.value;


		// Apply given config object to configDefaults
		this._config = Hoek.applyToDefaults(configDefaults, config);


		// Cookie jar for authenticated requests
		this._cookieJar = request.jar();

	}






	/**
	 * Authenticate with credentials and store sessionId in _cookieJar
	 * @return {Promsie} resolves if authentication succeeds
	 */
	_authenticate() {
		return new Promise((resolve, reject) => {

			let uri = this._extendBaseUrl('/ica/rest/nami/auth/manual/sessionStartup');

			request({
				method: 'POST',
				uri: uri,
				followAllRedirects: true,
				jar: this._cookieJar,
				form: {
					username: this._config.userId,
					password: this._config.password
				}
			}, (err, res) => {

				if(err) {
					return reject(err);
				}

				if(res.statusCode === 200) {
					return resolve({
						success: true
					});
				}

				reject(new Error('unknown authentication error'));

			});

		});
	}





	/**
	 * Extends base url by given _path. Base-Url is selected based on _config.production
	 * @param  {String} path uri path
	 * @return {String}      uri
	 */
	_extendBaseUrl(_path) {
		return (this._config.production ? this._config.productionBaseUrl : this._config.developmentBaseUrl) + _path;
	}






	/**
	 * raw request using _cookieJar and reauthentication
	 * @param  {Object} options request config
	 * @return {Promise}        resolves with {raw, body}
	 */
	_request(options) {
		return new Promise((resolve, reject) => {

			options.json = options.json || true;
			options.jar = options.jar || this._cookieJar;

			request(options, (err, res, body) => {
				if(err) {
					return reject(err);
				}

				if(body.success === false && body.message === 'Session expired') {
					return resolve(this._authenticate().then(() => this._request(options)));
				}

				resolve({
					raw: res,
					data: body
				});
			});
		});
	}






	/**
	 * Request members
	 * @param  {Object} query {limit, start, page}
	 * @return {Promise}      resolves with data from _request result
	 */
	getMembers(query) {

		let uri = this._extendBaseUrl(`/ica/rest/nami/mitglied/filtered-for-navigation/gruppierung/gruppierung/${this._config.groupId}/flist`);

		return this._request({
			method: 'GET',
			uri,
			qs: query || {}
		})
		.then((res) => res.data);

	}


	/**
	 * Request member roles
	 * @param  {Number} memberId
	 * @return {Promise}          resolves with data from _request result
	 */
	getMemberRoles(memberId, query) {

		let uri = this._extendBaseUrl(`/ica/rest/nami/zugeordnete-taetigkeiten/filtered-for-navigation/gruppierung-mitglied/mitglied/211605/flist`)

		return this._request({
			method: 'GET',
			uri,
			qs: query || {
				page: 1,
				start: 0,
				limit: 20
			}
		})
		.then((res) => res.data);
	}



	// TODO: Check why this req throws EXCEPTION
	// /**
	//  * Request member details
	//  * @param  {Number} memberId
	//  * @return {Promise}          resolves with data from _request result
	//  */
	// getMemberDetails(memberId) {

	// 	let uri = this._extendBaseUrl(`/ica/rest/nami/mitglied/filtered-for-navigation/gruppierung/gruppierung/${this._config.groupId}/${memberId}`)
	// 	console.log(uri);

	// 	return this._request({
	// 		method: 'GET',
	// 		uri,
	// 		qs: {
	// 			_dc: Date.now()/1000
	// 		}
	// 	})
	// 	.then((res) => res.data);

	// }

};
