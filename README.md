# dpsg-nami-client


Access NaMi-Api (German scout member management) via nodejs.

![Codeship Badge](https://codeship.com/projects/11cd67c0-8a43-0134-514f-5a7c9acf56e8/status?branch=master)

[@platdesign](https://twitter.com/platdesign)


# Basic Usage

```js
const NamiSdk = require('dpsg-nami-sdk');
const client = new NamiSdk({
	userId: 'api user id',
	groupId: 'id of your group',
	password: 'api user password',
	production: false // default
});

client.getMembers().then((res) => {
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
```


# Test
- copy `config.default.json` to `config.test.json` and set your parameters.
- run `npm test`



