module.exports = function (grunt) {
  grunt.initConfig({
    traceur: {
      options: {
        sourceMaps: true
      },
      custom: {
        files:{
          'dist/compile.js': 'src/compile.js'
        }
      }
    },
    nodeunit: {
      all: ['test/nodeunit.js']
    },
    hub: {
      all: {
        src: ['lib/html5-parser/Gruntfile.js'],
        tasks: ['jshint', 'nodeunit']
      }
    },
    watch: {
      sources: {
        files: ['src/*.js'],
        tasks: ['nodeunit'],
        options: {
          interrupt: true
        }
      },
      tokenizer: {
        files: ['lib//html5-parser/**/*.js'],
        tasks: ['hub', 'nodeunit'],
        options: {
          interrupt: true
        }
      },
      test: {
        files: ['test/*'],
        tasks: ['nodeunit'],
        options: {
          interrupt: true
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-hub');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['hub', 'nodeunit']);
};