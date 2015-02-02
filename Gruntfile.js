module.exports = function(grunt) {
    
    require('time-grunt')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // Builds SASS
        sass: {
          dev: {
            files: {
              'public/stylesheets/app.css': 'src/scss/app.scss'
            },
            options: {
              //includePaths: ['path/to/included/files'],
              outputStyle: 'expanded',
              imagePath: '../images'
            }
          }
        },

        scsslint: {
            dev: [
                'src/**/*.scss'
            ]
        },

        imagemin: {
            options: {
                optimizationLevel: 3
            },
            dev: {
                files: [{
                    expand: true, // Enable dynamic expansion
                    cwd: 'src/images/', // Src matches are relative to this path
                    src: ['**/*.{png,jpg,jpeg,gif}'], // Actual patterns to match
                    dest: 'public/images/' // Destination path prefix
                }]
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-scss-lint');
    grunt.loadNpmTasks('grunt-notify');
    
    // Build assets from src
    grunt.registerTask('build:css',                 ['scsslint:dev', 'sass:dev']);
    grunt.registerTask('build:img',                 ['imagemin:dev']);

    grunt.registerTask('build',                     ['build:css', 'build:img']);

    // Default task that happens during development
    grunt.registerTask('default', ['build:css']);

};
