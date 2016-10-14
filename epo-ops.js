/*
Module name:    epo-ops
Description:    Access some basic EPO Open Patent Services with node.js
Author:         Franklin van de Meent (https://frankl.in);
Source & docs:  https://github.com/fvdm/nodejs-epo-ops
Feedback:       https://github.com/fvdm/nodejs-epo-ops/issues
License:        Unlicense (public domain) - see UNLICENSE file

Service name:   European Patent Office - Open Patent Services
Service docs:   http://www.epo.org/searching/free/ops.html
*/


var http = require ('httpreq');

var config = {};
var app = {
  status: {}
};

/**
 * Base64 encode a string
 *
 * @param {String} str
 * @return {void}
 */
function base64_encode (str) {
  return new Buffer (str, 'utf8') .toString ('base64');
}

/**
 * Send HTTP request to API
 *
 * @param {String} method
 * @param {String} path
 * @param {Object} params
 * @param {Function} callback
 * @return {void}
 */
function talk (method, path, params, callback) {
  var options = {
    url: 'https://ops.epo.org/3.1' + path,
    parameters: params,
    method: method,
    timeout: config.timeout,
    headers: {
      'User-Agent': 'epo-ops.js (https://github.com/fvdm/nodejs-epo-ops)',
      'Accept': 'application/json' 
    }
  };

  // if (config.access_token) {
  //   options.headers.Authorization = 'Bearer ' + config.access_token;
  // } else {
  //   options.auth = base64_encode (config.consumer_key + ':' + config.consumer_secret);
  // }

  console.log("get " + options);
  console.log(options);

  http.doRequest (options, function (err, res) {
    var data = null;
    var error = null;
    var key;

    if (err) {
      return callback (err);
    }

    try {

      data = JSON.parse(res.body); 


      if (data.error) {
        error = new Error ('API error');
        error.error = data.error;
        data = null;
      }
    } catch (e) {
      error = e;
    }

    if (res.headers instanceof Object) {
      for (key in res.headers) {
        if (key.match (/^x_/)) {
          app.status [key] = res.headers [key];
        }
      }
    }

    callback (error, data);
  });
}

/**
 * Get access_token from API
 *
 * @param {Function} callback
 * @return {void}
 */
app.accessToken = function oauth_accesstoken (callback) {
  var params = {
    grant_type: 'client_credentials'
  };

  talk ('POST', '/auth/accesstoken', params, function (err, data) {
    if (err) {
      return callback (err);
    }

    if (data.access_token) {
      config.access_token = data.access_token;
    }

    callback (null, data);
  });
}

/**
 * Authenticated HTTP request
 *
 * @param {String} path
 * @param {Object} params
 * @param {Function} callback
 * @return {void}
 */
app.get = function oauth_get (path, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  talk ('GET', path, params, callback);
};




app.loadDetailof = function populateInfo(name, list) {

    var deferred = Promise.defer();
    
    // here will go the function's logic
    
    return deferred.promise;
}

app.getPopulated = function oauth_getPop (path, params, callback) {
  if (typeof params === 'function') {
    callback = params;
    params = null;
  }

  console.log("getPopulated");

  talk ('GET', path, params, function(error,data)
    {
      var patentlist = data["ops:world-patent-data"]["ops:biblio-search"]["ops:search-result"]["ops:publication-reference"];
    
      console.log("ready search")
    var promises = patentlist.map(function(patent) {
      return new Promise(function(resolve, reject) {


        ///rest-services/published-data/publication/epodoc/WO2016149300/biblio

        var id = patent["document-id"]["country"]["$"] + patent["document-id"]["doc-number"]["$"];

        console.log("serch for id " + id);

//https://ops.epo.org/3.1/published-data/publication/epodoc/US2016244791/biblio
//http://ops.epo.org/3.1/rest-services/published-data/publication/epodoc/US2016244791/biblio

        app.get('/rest-services/published-data/publication/epodoc/'+id+'/biblio', null, function (error,data) {

            console.log(error);
            console.log("data biblio ready");

            // console.log("results array");
            // console.log(data["ops:world-patent-data"]);
            // console.log(data["ops:world-patent-data"]["ops:biblio-search"]["ops:search-result"]["ops:publication-reference"]);
            

            patent['biblio'] = data;

             resolve();
        });


      });
    });

    Promise.all(promises)
    .then(function() { 

      console.log('all dropped)'); 

      callback(error,data);
    })
    .catch(console.error);


    }
    );
};


/**
 * Module configuration
 * returns object with methods
 *
 * @param {Object} params
 * @return {Object}
 */
module.exports = function (params) {
  var key;

  for (key in params) {
    config [key] = params [key];
  }

  return app;
};
