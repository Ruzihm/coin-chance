/*
 *  Copyright 2014 Richard Van Tassel
 *
 *  This file is part of Coin-chance.
 *
 *  Coin-chance is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Coin-chance is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with Coin-chance.  If not, see <http://www.gnu.org/licenses/>.
 */

var path = require('path');

module.exports = function(grunt) {
    grunt.initConfig({
        my_src_files: [
                '*.js', 
                'src/routes/*.js',
                'src/public/js/coin-chance.js',
                'src/public/js/coin-chance-login.js',
                'src/views/*.js',
                'src/model/*.js'],
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                curly:true,
                eqnull:true,
                eqeqeq:true,
                undef:true,
                node:true,
                jquery:true,
                browser:true
            },

            dev: {
                options:{
                    devel:true
                },
                src: '<%= my_src_files %>'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-express');

    grunt.registerTask('default', ['jshint:dev']);
};
