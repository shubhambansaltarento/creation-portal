'use strict';
angular.module('playerApp')
    .service('learnService', function(httpServiceJava, config, $rootScope) {
        this.enrolledCourses = function(uid) {
            var url =  config.URL.LEARNER_PREFIX + config.URL.COURSE.GET_ENROLLED_COURSES + '/' + uid;
            return httpServiceJava.get(url);
        };

        this.otherSections = function(req) {
            var url =  config.URL.LEARNER_PREFIX + config.URL.COURSE.GET_LEARN_OTHER_SECTION;           
            return httpServiceJava.get(url);
        };
        this.recommendedCourses=function(req) {
            var url =  config.URL.LEARNER_PREFIX + config.URL.COURSE.RECOMMENDED_COURSE;           
            return httpServiceJava.post(url,req);
        };
    });
