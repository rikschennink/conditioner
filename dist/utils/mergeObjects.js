define(function(){

    'use strict';

	var exports = function(target,src) {

		var array = Array.isArray(src);
		var dst = array && [] || {};

		src = src || {};

		if (array) {
            // arrays are not merged
            dst = src.concat();
		}
		else {

			if (target && typeof target === 'object') {

				Object.keys(target).forEach(function (key) {
					dst[key] = target[key];
				});

			}

			Object.keys(src).forEach(function (key) {

				if (typeof src[key] !== 'object' || !src[key]) {
					dst[key] = src[key];
				}
				else {
					if (!target[key]) {
						dst[key] = src[key];
					}
					else {
						dst[key] = exports(target[key], src[key]);
					}
				}

			});
		}

		return dst;
	};

	return exports;
});