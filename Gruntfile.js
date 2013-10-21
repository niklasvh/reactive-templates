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
    watch: {
      sources: {
        files: ['src/*.js'],
        tasks: ['nodeunit'],
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

  grunt.loadNpmTasks('grunt-contrib-nodeunit');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('default', ['nodeunit']);
};