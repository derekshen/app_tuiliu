seajs.config({
	alias: {
    	'jquery':'assets/js/jquery-2.0.3.min.js',
    	'json2':'util/json2.js',
    	'misc':'util/misc.js',
    	'dataset':'util/dataset.js',
		'bootstrap.js':'assets/js/bootstrap.min.js',
		'common':'common.js',

		'bootstrap-datepicker':'assets/js/datetime/bootstrap-datetimepicker.min.js'
	},
	preload: ['jquery','json2','misc','dataset']
});