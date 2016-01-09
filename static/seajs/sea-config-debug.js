//通用模块
seajs.config({
	      alias: {
	       'json2':'util/json2.js',
	       'misc':'util/misc.js',
	       'dataset':'util/dataset.js',
	       'bootstrap-datepicker':'plugins/datepicker/bootstrap-datetimepicker.min.js',
	       'common':'util/common.js',
	      }
	    });
//debug
if (location.href.indexOf("127.0.0.1") > 0) {
	seajs.config({
	      alias: {
	       'jquery': 'jquery/1.11.1/jquery.js',
	       'bootstrap':'bootstrap/3.3.5/js/bootstrap.min.js'
	      },
	      preload: ["jquery"]
	    });
}
else {
	seajs.config({
	      alias: {
	       'jquery': 'assets/js/jquery-2.0.3.min.js',
	       'bootstrap':'bootstrap/3.3.5/js/bootstrap.js'
	      },
	      preload: ["jquery"]
	    });
}