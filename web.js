var express      = require('express');
var path         = require('path');
var logger       = require('morgan');
var compression  = require('compression');
var cookieParser = require('cookie-parser');
var session      = require('express-session');
var bodyParser   = require('body-parser');
var errorHandler = require('errorhandler');
var multer       = require('multer')

var routes = require('./routes');

var app = express();

app.set('env', process.env.ENV || 'development');
app.set('port', process.env.PORT);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

if(app.get('env') == 'development') {
    app.use(logger('dev'));
    var edt = require('express-debug');
    edt(app);
}

app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer());
app.use(cookieParser());
app.use(session({ secret: process.env.SESSION_SECRET, key: 'SID', resave:true, saveUninitialized:true }));

app.use(function( req, res, next ) {
    res.locals.filesPath = path.join(__dirname, 'files/');
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

/*
 *  ROUTES
 */

// Pages générales
app.get('/', routes.index);
app.post('/upload', routes.upload);
app.get('/download/:num', routes.download);

if(app.get('env') == 'development') {
    app.use(errorHandler());
}

/*
 *  ERREUR 404
 */
app.use(function( req, res, next ) {
    var err = new Error('Page introuvable');
    err.status = 404;
    next( err );
});

/*
 *  TOUTES LES AUTRES ERREURS
 */
app.use(function( err, req, res, next ) {
    res.render('erreur', { title:'Erreur', error:err });
});

var server = app.listen(app.get('port'), function() {
    console.log('Express server listening on port %d', app.get('port'));
});
