var Promise = require('bluebird');

var _ = require('lodash');

var wrap = module.exports =  function wrap(genFn) {

    var cr = Promise.coroutine(genFn);

    return function (req, res, next) {

    	var _send = res.send;
	    res.sent = false;
	    res.send = function(data){
	        // if(res.sent) return;
	        _send.bind(res)(data);
	        res.sent = true;
	    };

        cr(req, res, next)
            .then(responseReturn(res))
            .catch(handleError(res))
            .catch(next)
    }

}

var config = {
	i18n:null,

}

wrap.configure = function(newConfig) {

	config=_.extend(config,newConfig)
	wrap.applyMethods()

}

wrap.setResponse = function(name,newResponse) {
	var response={}
	response[name]=newResponse
	defaultResponses=_.extend(defaultResponses,response)
	wrap.applyMethods()

}

wrap.setResponses = function(newResponses) {

	defaultResponses=_.extend(defaultResponses,newResponses)
	wrap.applyMethods()

}

var defaultResponses = {

	Created: {
		statusCode:201,
		response:function(data) {
			return {
				status: 'success', 
	        	message: 'Created with success',
	        	id: typeof data =='object' && data.id||null
			}
		}
	},

	Deleted: {
		statusCode:204,
		response:function(data) {
			return {
				status: 'success', 
	        	message: 'Deleted with success',
	        	id: typeof data =='object' && data.id||null
			}
		}
	},

	Updated: {
		response:function(data) {
			return {
				status: 'success', 
	        	message: 'Updated with success',
	        	id: typeof data =='object' && data.id||null
			}
		}
	},

	Error: {
		statusCode:400,
		view:'Error',
		response:function(data) {
			return {
				status: 'error', 
	        	errorType: typeof data =='object' && data.name||null,
	        	message: typeof data =='object' && data.message||data
			}
		}
	},

	NotFound: {
		statusCode:404,
		view:'NotFound',
		response: {
			message: 'NotFound'
		}
	},

}

wrap.applyMethods= function applyMethods() {
	
	for(var key in defaultResponses){

		this[key] = createWrapped(key)
		
	}
}
wrap.applyMethods()

function createWrapped(key) {
	return function(data) {

		return new Wrapped(defaultResponses[key], data, key)

	}
}

function Wrapped(pattern, data, key) {

	if('response' in pattern){
		if(typeof pattern.response =='function' ){
			this.result= pattern.response(data)
		}else{
			this.result= pattern.response
		}
	}else{
		this.result=data
	}
	this.key=key

	if(config.i18n && typeof this.result=='object'
		 && typeof this.result.message === 'string'){
		this.result.message=config.i18n(this.result.message)
	}

	this.statusCode=pattern.statusCode||200
	this.view=pattern.view
	this.wrapped=true

}


function responseReturn(res) {

	return function(data){

		if(typeof data === 'object'){
			var dataPromise=Promise.props(data)
		}else{
			var dataPromise=Promise.resolve(data)
		}

		return dataPromise
		.then(function(data){

			var status

			if(typeof data =='object' && data.wrapped){

				if(data.view){
					if(typeof data.result !=='object'){
						data.result={data:data.result}
					}
					res.status(data.statusCode).render(data.view, data.result)
					return null
				}

				status=data.statusCode;
				data=data.result;
			}


			if(data===null||data===undefined)return null

			status=status|| (data && data.statusCode) || 200

			res.status(status).send(data)
		})

	}

}

function handleError(res) {

	return function (err) {

		if(typeof err =='object' && err.wrapped){
			responseReturn(res)(err)

		}else if(err.name in defaultResponses && !res.sent){
			var wrapped = createWrapped(err.name)(err)

			responseReturn(res)(wrapped)

		}else{
			throw err
		}
	}

}