<!DOCTYPE html>
<html  lang="zh-CN"><head>
<meta charset="utf-8">
<script src="jquery.min.js"></script>
<link href="bootstrap.min.css" rel="stylesheet">
<script src="bootstrap.min.js"></script>
</head>
<body spellcheck="false">
<div class=" aw-main-content" style="min-height: 800px; max-height: 2000px;">
<div id="content-wrapper" style="height: 600px;width: 100%">
	<div id="jsonformatter"></div>
	<div id="splitter"></div>
	<div id="jsoneditor">
		<div class="jsoneditor-frame">
			<div class="jsoneditor-menu"></div>
		</div>
	</div>
</div>
<link href="app.css" rel="stylesheet" type="text/css"/>
<link href="jsoneditor.css" rel="stylesheet" type="text/css"/>
<script src="jsoneditor.js" type="text/javascript"></script>
<script src="notify.js" type="text/javascript"></script>
<script src="splitter.js" type="text/javascript"></script>
<script src="app.js" type="text/javascript"></script>
<script src="jsonlint.js" type="text/javascript"></script>
<link href="jquery.reject.css" rel="stylesheet" type="text/css"/>
<script type="text/javascript" src="../../static/jquery/jquery-2.0.3.min.js"></script>

<script src="jquery.reject.js" type="text/javascript"></script>
<script src="jquery.reject.360.js" type="text/javascript"></script>
<script type="text/javascript">

try{
	var status="success";
	app.load();
	app.resize();
	setValue("{\"a\":\"1\"}");
	function setValue(jsonstr){
		$("#jsonformatter").find(".jsonformatter-textarea").val(jsonstr);
		$("#toForm").click();
		$("#toJSON").click();
	}
	$(document).ready(function(){
	 $("body").bind("keyup",function(evt){
		 if(evt.keyCode==119||evt.keyCode==120){
				if(typeof(parent.jsonFormat)!="undefined")parent.jsonFormat.closeBut.click();
		 }
	 });
});
	
}
catch(e){
}
</script>
</div>
</body>
</html>