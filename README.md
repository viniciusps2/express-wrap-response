Warning: I do not yet published this package in NPM.

# How to use

	var wrap = require('express-wrap-response');


	app.get('/yields', wrap(function *(req,res) {

		var data = yield Promise.resolve('Promise resolved!');

		return data

	}))

	app.get('/promise', wrap(function *(req,res) {

		return Promise.resolve('Promise resolved!');

	}))

	app.get('/promiseProps', wrap(function *(req,res) {

		return {
			a: Promise.resolve('Promise A resolved!'),
			b: Promise.resolve('Promise B resolved!'),
			c: 'Value C'
		}

	}))


	//vanilla render
	app.get('/', wrap(function *(req,res) {

		res.render('home',{message: 'Test message!'})

	}))


	wrap.setResponse('CustomView', {
		view: 'home'
	})

	app.get('/customViewWithGenericData', wrap(function *(req,res) {

		return wrap.CustomView('Custom Message!');
		//send to render: {data: 'Custom Message!'}

	}))





	wrap.setResponse('CustomCreated', {
		statusCode: 201,
		view: 'created',
		response: {
			message: 'Created!'
		}
	})

	app.get('/customCreated', wrap(function *(req,res) {

		return wrap.CustomCreated()

	}))





	app.get('/created', wrap(function *(req,res) {

		return wrap.Created('mmmm')
	}))


	app.get('/deleted', wrap(function *(req,res) {

		return wrap.Deleted('mmmm')
	}))

	app.get('/NotFound', wrap(function *(req,res) {

		throw wrap.NotFound()
	}))



	app.get('/error', wrap(function *(req,res) {

		throw wrap.Error('New Error!')
		
	}))


	app.get('/errorVanilla', wrap(function *(req,res) {

		throw new Error('New Error Vanilla!')

	}))

