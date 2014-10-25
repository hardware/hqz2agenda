var moment = require('moment');

exports.settings = function( req, res, options, callback ) {

    var settings = {
        path:req.path,
        title:"Hqz2agenda - ",
        moment:moment
    };

    callback( settings );

};
