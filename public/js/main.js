Dropzone.options.fileDropzone = {

    maxFilesize: 0.1, // 100 Ko

    accept: function( file, done ) {
        if(file.name.split('.').pop() != "xlsx")
            done("Mauvais format de fichier");
        else
            done();
    },

    init: function() {
        this.on("success", function( file, resp ) {
            if( ! resp.error && resp.url )
                // window.location.replace( resp.url );
                window.location.href = resp.url;
            else
                alert( resp.error );
        });

        this.on("error", function( file, resp ) {
            if( resp.error ) alert( resp.error );
        });
    }
};
