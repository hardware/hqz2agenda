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

        if( ! req.query.type )
            req.session.type = 'google';
        else
            req.session.type = req.query.type;

        switch( req.session.type ) {
            case 'google' : req.session.extension = '.csv'; break;
            case 'outlook': req.session.extension = '.ics'; break;
        }

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

            errorHandler( err, null, res );

            var num = ( Math.floor(Math.random() * (999999999 - 99999999) + 99999999) );
            var fileName = 'planning-' + num;
            var path = res.locals.filesPath + fileName;

            fs.writeFile(path + '.xlsx', buffer, function( err ) {

                errorHandler( err, path, res );
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

        res.download(path + req.session.extension, 'planning' + req.session.extension, function( err ) {

            errorHandler( err, null, res );

            if( fs.existsSync(path + '.xlsx') )
                fs.unlinkSync(path + '.xlsx');

        });

    });

};

var errorHandler = function( err, path, res ) {

    if( err ) {

        // Suppression des fichiers temporaires
        if( path ) removeTmpFiles( path );

        res.status( 500 );
        res.json({ error:err });
        return;

    }

};

var removeTmpFiles = function( path ) {

    // Suppression du fichier CSV/ICS
    if( fs.existsSync(path + req.session.extension) )
        fs.unlinkSync(path + req.session.extension);

    // Suppression du fichier XLSX
    if( fs.existsSync(path + '.xlsx') )
        fs.unlinkSync(path + '.xlsx');

};

var genCSVFile = function( path, num, req, res, next ) {

    parseXlsx(path + '.xlsx', function( err, data ) {

        errorHandler( err, path, res );

        var days = data[0];
        var hours = data[1];

        if( days.length != hours.length ) {
            errorHandler('Le nombre de colonnes correspondantes est invalide. ( ' + days.length + ' / ' + hours.length + ' )', path, res);
            return;
        }

        var daysSorted  = [];
        var hoursSorted = [];

        var year = S(days[0]).left(4).s;

        if( year.length != 4 || S( year ).isNumeric() === false ) {
            errorHandler('Année invalide (' + year + ')', path, res);
            return;
        }

        var month = S(days[0]).chompLeft(year + ' ').s;

        switch( month ) {
            case 'Janvier'  : month = '01'; break;
            case 'Février'  : month = '02'; break;
            case 'Mars'     : month = '03'; break;
            case 'Avril'    : month = '04'; break;
            case 'Mai'      : month = '05'; break;
            case 'Juin'     : month = '06'; break;
            case 'Juillet'  : month = '07'; break;
            case 'Août'     : month = '08'; break;
            case 'Septembre': month = '09'; break;
            case 'Octobre'  : month = '10'; break;
            case 'Novembre' : month = '11'; break;
            case 'Décembre' : month = '12'; break;
            default:
                errorHandler('Valeur inconnue pour le mois en cours.', path, res);
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

        switch( req.session.type ) {
            case 'google':
                var header = "Subject,Start Date,Start Time,End Date,End Time,All day event,Description,Location,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,, \r\n";
                break;

            case 'outlook':
                var header = "BEGIN:VCALENDAR \r\n     \
                VERSION:2.0 \r\n                       \
                PRODID:-//Horoquartz2calendar//EN \r\n \
                CALSCALE:GREGORIAN \r\n                \
                X-WR-CALNAME;VALUE=TEXT:planning \r\n";
                header = String( header ).replace(/^\s+|\s+$/g, '');
                break;
        }

        fs.appendFile(path + req.session.extension, header, function( err ) {

            errorHandler( err, path, res );

            async.eachSeries(daysSorted, function( day, nextDay ) {

                switch( hoursSorted[i] ) {
                    case 'M':
                        Subject = 'Matin';
                        StartTime = '07:00';
                        EndTime = '16:00';
                        AllDayEvent = 'False';
                        Location='AIToulouse';
                        break;
                    case ':M':
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
                    case ':S':
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
                        errorHandler('Horaire inconnu. Valeurs possibles : (:)M / (:)S / (:)RTT', path, res);
                        return;
                }

                switch( req.session.type ) {
                    case 'google':
                        var date = day + '/' + month + '/' + year;
                        var vevent = S([Subject,date,StartTime,date,EndTime,AllDayEvent,Subject,Location]).toCSV({
                            delimiter: ',',
                            qualifier: ' ',
                            escape: '\\',
                            encloseNumbers: false
                        }).s.replace(/ /g,'');
                        break;

                    case 'outlook':
                        var vevent = "BEGIN:VEVENT \r\n \
                        SUMMARY:" + Subject + " \r\n \
                        DESCRIPTION:" + Subject + " \r\n \
                        DTSTART:" + year + month + day + "T" + S(StartTime).left(2).s + "0000z \r\n \
                        DTEND:" + year + month + day + "T" + S(EndTime).left(2).s + "0000z \r\n \
                        LOCATION:AIToulouse \r\n \
                        END:VEVENT \r\n";
                        vevent = String( vevent ).replace(/^\s+|\s+$/g, '');
                        break;
                }

                fs.appendFile(path + req.session.extension, vevent, function( err ) {

                    errorHandler( err, path, res );

                    i++;
                    nextDay();

                });
            }, function( err ) {

                errorHandler( err, path, res );

                switch( req.session.type ) {
                    case 'google' : var bottom = ''; break;
                    case 'outlook': var bottom = 'END:VCALENDAR'; break;
                }

                fs.appendFile(path + req.session.extension, bottom, function( err ) {

                    errorHandler( err, path, res );

                    var url = process.env.APP_URL + 'download/' + num;

                    res.status( 200 );
                    res.json({ url:url, error:null });

                });
            });
        });
    });
};

