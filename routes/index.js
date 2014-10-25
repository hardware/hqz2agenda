var data      = require('./data');
var parseXlsx = require('excel');
var async     = require('async');
var S         = require('string');
var fs        = require('fs');

/*
 *  Index
 *  Route : /
 *  Methode : GET
 */
exports.index = function( req, res, next ) {

    data.settings(req, res, {}, function( settings ) {

        settings.title += "Accueil";
        res.render('index', settings);

    });

};

/*
 *  Upload du fichier xslx
 *  Route : /upload
 *  Methode : POST
 */
exports.upload = function( req, res, next ) {

    data.settings(req, res, {}, function( settings ) {
        fs.readFile(req.files.file.path, function( err, buffer ) {

            var num = ( Math.floor(Math.random() * (999999999 - 99999999) + 99999999) );
            var fileName = 'planning-' + num + '.xslx';
            var path = res.locals.filesPath + fileName;

            fs.writeFile(path, buffer, function( err ) {
                genCSVFile( path, num, req, res, next );
            });

        });
    });

};

/*
 *  Download du fichier csv
 *  Route : /download
 *  Methode : POST
 */
exports.download = function( req, res, next ) {

    data.settings(req, res, {}, function( settings ) {

        var path = res.locals.filesPath + 'planning-' + req.params.num;

        res.download(path + '.csv', 'planning.csv', function( err ) {
            if( err ) { next( err ); return; }
            fs.unlinkSync(path + '.csv');
            fs.unlinkSync(path + '.xslx');
        });

    });

};

var genCSVFile = function( file, num, req, res, next ) {

    parseXlsx(file, function( err, data ) {

        if( err ) { next( err ); return; }

        var days = data[0];
        var hours = data[1];
        var daysSorted  = [];
        var hoursSorted = [];
        var year = S(days[0]).left(4).s;
        var month = S(days[0]).chompLeft(year + ' ').s;

        switch( month ) {
            case 'Janvier'  : month = '01'; break;
            case 'Fevrier'  : month = '02'; break;
            case 'Mars'     : month = '03'; break;
            case 'Avril'    : month = '04'; break;
            case 'Mai'      : month = '05'; break;
            case 'Juin'     : month = '06'; break;
            case 'Juillet'  : month = '07'; break;
            case 'Aout'     : month = '08'; break;
            case 'Septembre': month = '09'; break;
            case 'Octobre'  : month = '10'; break;
            case 'Novembre' : month = '11'; break;
            case 'Decembre' : month = '12'; break;
            default:
                next( new Error("FATAL: Valeur inconnue pour le mois en cours.") );
                return;
        }

        days.splice(0, 1);
        hours.splice(0, 1);

        var i = 0;

        async.eachSeries(days, function( item, nextItem ) {

            var l = S( item ).left(1).s

            if( l == 'L' || l == 'M' || l == 'J' || l == 'V' ) {

                var dayVal = days[i].substring(2);

                if( dayVal.length < 2 )
                    daysSorted.push( '0' + dayVal );
                else
                    daysSorted.push( dayVal );

                hoursSorted.push( hours[i] );
            }

            i++;
            nextItem();

        });

        i = 0;
        req.session.prevVal = hoursSorted[0];

        async.eachSeries(hoursSorted, function( item, nextItem ) {

            if( S(item).isEmpty() )
                hoursSorted[i] = req.session.prevVal;
            else
                req.session.prevVal = item;

            i++;
            nextItem();

        });

        delete req.session.prevVal;
        i = 0;

        var fileName = 'planning-' + num + '.csv';
        var header = 'Subject,Start Date,Start Time,End Date,End Time,All day event,Description,Location,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,';

        fs.appendFile(res.locals.filesPath + fileName, header, function( err ) {

            if( err ) { next( err ); return; }

            async.eachSeries(daysSorted, function( day, nextDay ) {

                // Subject, Start Date, Start Time, End Date, End Time, All day event, Description, Location
                // Matin,11/03/14,07:00,11/03/14,16:00,False,Matin,AIT

                switch( hoursSorted[i] ) {
                    case 'M':
                        Subject = 'Matin';
                        StartTime = '07:00';
                        EndTime = '16:00';
                        AllDayEvent = 'False';
                        Location='AIToulouse';
                        break;
                    case 'S':
                        Subject = 'Soir';
                        StartTime = '10:00';
                        EndTime = '19:00';
                        AllDayEvent = 'False';
                        Location='AIToulouse';
                        break;
                    case ':RTT':
                        Subject = 'RTT';
                        StartTime = '00:00';
                        EndTime = '00:00';
                        AllDayEvent = 'True';
                        Location='';
                        break;
                    case 'RTT':
                        Subject = 'RTT';
                        StartTime = '00:00';
                        EndTime = '00:00';
                        AllDayEvent = 'True';
                        Location='';
                        break;
                    default:
                        next( new Error("FATAL: Horaire inconnu ! Valeurs possibles : M / S / RTT") );
                        return;
                }

                var date = day + '/' + month + '/' + year;

                var line = S([Subject,date,StartTime,date,EndTime,AllDayEvent,Subject,Location]).toCSV({
                    delimiter: ',',
                    qualifier: ' ',
                    escape: '\\',
                    encloseNumbers: false
                }).s.replace(/ /g,'');

                fs.appendFile(res.locals.filesPath + fileName, '\r\n'+line, function( err ) {

                    if( err ) { next( err ); return; }

                    i++;
                    nextDay();

                });
            }, function( err ) {

                if( err ) { next( err ); return; }

                var url = process.env.APP_URL + 'download/' + num;
                res.send( url );
            });
        });
    });
};

