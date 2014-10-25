Dropzone.options.fileDropzone = {

    maxFilesize: 0.1, // 100 Ko

    accept: function( file, done ) {
        if(file.name.split('.').pop() != "xlsx")
            done("Mauvais format de fichier");
        else
            done();
    },

    init: function() {
        this.on("success", function( file, url ) {
            window.location.replace( url );
        });
    }
};
