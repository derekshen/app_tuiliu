var appkey = "23264159";
function getRootURL() {
	//依据Web端口号 区分 是前端用还是 后端用；上海web服务器不能用7000端口
	if (document.location.host.indexOf("7000")>0){
		//后台开发人员的端口都是7000	
		//return 'http://127.0.0.100:7000';
		return 'http://' + document.location.host;
	}else{
		//上海前端开发人员用，海宁总部测试服务器
		return 'http://120.27.145.36:60';
	}

	/**
	var projectName = document.location.pathname.substring(document.location.pathname.indexOf('/') + 1);
	projectName = projectName.substring(0, projectName.indexOf('/'));
	if(projectName == 'tiulo' || projectName == 'test'){
		return 'http://' + document.location.host +'/'+ projectName;
	}else{
	}
	**/
	return 'http://' + document.location.host;
}

function round(number1,dec){
  return dec>=1?parseFloat(number1.toFixed(dec)):parseInt(number1.toFixed(dec)); 
}

function getTokenValue(key){
	//可能需要重写
	return localStorage.getItem(key);
}
function setTokenValue(key,value){
	//可能需要重写
	return localStorage.setItem(key,value);
}

function  getCommand2(command){
	if (command.commandType=="Query"){
		command.params=JSON.parse(command.params);
	}else if (command.commandType=="Update"){
		command.datasets=JSON.parse(command.datasets);
	}
	return command;
}

function  getCommand(arg,commandType){
	var action   =arg.action;
	var datasets =arg.datasets;
	var pageIndex=arg.pageIndex;
	var pageSize =arg.pageSize;
	var queryId   =arg.queryId;
	var params   =arg.params;
	var printJson  =arg.printJson;
	var token      =getTokenValue("token");
	
	var showFields =arg.showFields;
	var showLoading=typeof(arg.showLoading)=="undefined"?true:arg.showLoading;
	var showError=typeof(arg.showError)=="function"?arg.showError:function(e){};
	var rowId=typeof(arg.rowId) =='undefined'?1:arg.rowId;
	
	datasets =typeof(datasets) =='undefined'?{}:datasets;
	pageIndex=typeof(pageIndex)=='undefined'? 1 :pageIndex;
	pageSize =typeof(pageSize) =='undefined'?100:pageSize;
	params   =typeof(params)   =='undefined'?{}:params;
	showFields=typeof(showFields)=='undefined'?"":showFields;
	printJson=typeof(printJson)=='undefined'?true:printJson;
	
	if(action!=null && action.charAt(0)!='/'){
		action='/'+action;
	}
	
	if (token=="undefined" || token==null ) token="";
	
	if (commandType=="Query"){
		return {"action":action,"commandType":"Query","pageIndex":pageIndex,"pageSize":pageSize,"params":JSON.stringify(params),
		"showFields":showFields,"token":token,"printJson":printJson,"showLoading":showLoading,"showError":JSON.stringify(showError),
		"queryId":queryId,"rowId":rowId};
	}else if (commandType=="Update"){
		return {"action":action,"commandType":"Update","datasets":JSON.stringify(datasets),"params":JSON.stringify(params),
		"token":token,"printJson":printJson,"showLoading":showLoading,"showError":JSON.stringify(showError),
		"queryId":queryId,"rowId":rowId};
	}else{
		alert("getCommand 参数commandType 值传入错误，只能是Query Update,当前值是 "+commandType);
	}
}

function doAjaxQuery(arg,evt){
	var command=getCommand(arg,"Query");
	doAjaxExecute(command,evt);
}

function doAjaxUpdate(arg,evt){
	var command=getCommand(arg,"Update");
	doAjaxExecute(command,evt);
}

function doAjaxExecute(command,evt){
	//可能需要重写
	if(command.showLoading)myTip.show();
	var url=getRootURL() + "/rest"+command.action;
	var pstr=$.param(command);
	if(command.action.indexOf("export")!=-1){
		if(command.showLoading)myTip.close();
		$("#f_load").attr("action",url+"?"+pstr);
		$("#f_load").find("input").click();
	}else
	$.ajax({
		url: url,
		cache: false,
		type: "POST",
		dataType:"jsonp",
		timeout:2*60*1000,//单位毫秒 设置为2分钟 调试程序用
		async:true,
		jsonp:"jsonp_data",
		data: pstr,
		success: function(data){
			if(command.showLoading)myTip.close();
			if(data.status=='0'){//后台出错，显示消息
				if(typeof(command.showError)=="function"){
					command.showError(data.info);
				}else{
					alert(data.info);
				}
			}
			 if(typeof(evt)!="undefined")evt(data);
		},error:function(XMLHttpRequest, textStatus, errorThrown){
			if(command.showLoading)myTip.close();
			if (typeof(XMLHttpRequest.status)=="number"){
				if (XMLHttpRequest.status==404 && errorThrown==""){
					errorThrown="服务器可能没有开启";
				}else if (XMLHttpRequest.status==0 && errorThrown==""){
					errorThrown="请求未初始化";
				}
			}
			
			if(typeof(command.showError)=="function"){
				command.showError(JSON.stringify(errorThrown));
			}else{
				alert(JSON.stringify(errorThrown));
			}
		}
	});
}
//将网页上某行的数据 处理为JS对象
var rdMap={};
function recordToRow(rowLine,outField,isValue){
	var row={};
	if (rowLine.data("state")!=undefined){row["state"]=rowLine["state"];}
	rowLine.find("input").each(function(){
		var f=$(this).attr("name");
		if(f!=undefined){
			if( outField==null||outField[f]==null){
				var value ="";
				if($(this).attr("type")=="text")value=$(this).val();
				else if($(this).attr("type")=="checkbox"){
					value=$(this).attr("checked")=="checked"||$(this).attr("checked")==true?"1":"0";
				}
				if (!isValue||!isNull(value)) row[f]=value;
			}
		}
	});
	return row;
}

function joToDatasetBySave(dataset,data,isQuery){
	if(typeof(dataset)=="undefined"||dataset==null)return;
	jsonToUI(dataset,data,isQuery);
}


function isNull(obj){
	   if(obj==undefined)return true;
	   if(typeof(obj)=="undefined")return true;
	   if (obj == null) return true;
	   if (typeof(obj)=="number"&&obj==0)return false;
	   if (obj == "") return true;
	   if (obj == '') return true;
	   return false;
}

function getParent(){
	var parentObj=null;
	for(var i=0;i<6;i++){
		if(isNull(parentObj)) parentObj = window.parent;
		if(isNull(parentObj.firstWeb)){
			parentObj = parentObj.parent;
		}else{
			break;
		}
	}
	return parentObj;
}

function checkNull(dataset,str){
	var err=[];
	var arr=str.split(",");
	for(var i=0;i<arr.length;i++){
		var f=arr[i];
		if(!isNull(dataset.getValue(f)))continue;
		var lb=dataset.getField(f).getLabel();
		err.push(lb);
	}
	return err;
}
 

function HashList() {
    this._array = new Array();
    this._objects = new Object();
    this.length=0;
}
HashList.prototype.add = function(key, object) {
    this.put(key,object);
}
HashList.prototype.put = function(key, object) {
    if (key == null)
        return;
    if (typeof (key) == "object")
        key = key._hashCode;
    var array = this._array;
    var objects = this._objects;
    var $2 = objects[key];
    if (typeof ($2) == "undefined") {
        array.push(object);
    } else {
        var i = array.indexOf($2);
        if (i >= 0) {
            array[i] = object;
        }
    }
    objects[key] = object;
    object.$mw = key;
    this.length = this._array.length;
}
HashList.prototype.get = function(key) {
    if (typeof (key) == "number") {
        return this._array[key];
    } else {
        if (typeof (key) == "object")
            key = key._hashCode;
        return this._objects[key];
    }
}
HashList.prototype.indexOf = function($r) {
    if (typeof ($r) == "object")
        $r = $r._hashCode;
    var $2 = this._objects[$r];
    if ($2 != null) {
        return this._array.indexOf($2);
    } else {
        return -1;
    }
}
HashList.prototype.remove = function(key) {
    var array = this._array;
    var objects = this._objects;
    var $2 = null;
    if (typeof (key) == "number") {
        $2 = array[key];
        array.splice(key, 1);
        delete objects[$2.$mw];
    } else {
        if (typeof (key) == "object")
            key = key._hashCode;
        $2 = objects[key];
        delete objects[key];
        var i = array.indexOf($2);
        if (i >= 0) {
            array.splice(i, 1);
        }
    }
    this.length = this._array.length;
    return $2;
}
HashList.prototype.clear = function() {
    this._array = new Array();
    this._objects = new Object();
    this.length=0;
}
HashList.prototype.size = function() {
    return this._array.length;
}
HashList.prototype.toString = function() {
    var s = "";
    var array = this._array;
    try {
        for (var i=0;i<array.length;i++){
            s = s+"\n" + array[i].toString();
        }
    }catch(err){
    }
    return s;
}


function getDateTime(){
	var d,s,t;d=new Date();s=d.getFullYear().toString(10)+"-";t=d.getMonth()+1;s+=(t>9?"":"0")+t+"-";
   t=d.getDate();
   s+=(t>9?"":"0")+t+" ";t=d.getHours();s+=(t>9?"":"0")+t+":";t=d.getMinutes();s+=(t>9?"":"0")+t+":";t=d.getSeconds();s+=(t>9?"":"0")+t;
   return s;
 }

function getDTime(r,s)
{
  var d,s,t;
  d=r.getValue(s);
  s=d.getFullYear().toString(10)+"-";
  t=d.getMonth()+1;
  s+=(t>9?"":"0")+t+"-";
  t=d.getDate();
  s+=(t>9?"":"0")+t+" ";
  t=d.getHours();
  s+=(t>9?"":"0")+t+":";
  t=d.getMinutes();
  s+=(t>9?"":"0")+t+":";
  t=d.getSeconds();
  s+=(t>9?"":"0")+t;
  return s;
}

Date.prototype.format=function(fmt) {         
    var o = {         
    "M+" : this.getMonth()+1, //月份         
    "d+" : this.getDate(), //日         
    "h+" : this.getHours()%12 == 0 ? 12 : this.getHours()%12, //小时         
    "H+" : this.getHours(), //小时         
    "m+" : this.getMinutes(), //分         
    "s+" : this.getSeconds(), //秒         
    "q+" : Math.floor((this.getMonth()+3)/3), //季度         
    "S" : this.getMilliseconds() //毫秒         
    };         
    var week = {         
    "0" : "/u65e5",         
    "1" : "/u4e00",         
    "2" : "/u4e8c",         
    "3" : "/u4e09",         
    "4" : "/u56db",         
    "5" : "/u4e94",         
    "6" : "/u516d"        
    };         
    if(/(y+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));         
    }         
    if(/(E+)/.test(fmt)){         
        fmt=fmt.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "")+week[this.getDay()+""]);         
    }         
    for(var k in o){         
        if(new RegExp("("+ k +")").test(fmt)){         
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));         
        }         
    }         
    return fmt;         
} ;







function JSONFormat(){
	var html='<div class="modal fade" id="myModal" tabindex="-1" role="dialog"  aria-hidden="true" style="width:100%;">'+
		'<div class="modal-dialog" style="width:90%;">'+
		'<div class="modal-content">'+
		'<div class="modal-header">'+
		'<button id="jsonClose" type="button" class="close"  data-dismiss="modal" aria-hidden="true"> &times; </button>JSON格式化'+
		'</div>'+
		' <div class="modal-body">'+
		'<iframe  name=\"jsonFormat1\" src="'+getRootURL()+'/static/jsonFormat/jsonFormat.jsp" width="100%" height="600px"  marginheight="0" marginwidth="0" frameborder="0" top="0" left="0" ></iframe>'+
		'</div>'+
		' <div class="modal-footer">供开发人员使用</div>'+
		'</div>'+
		'</div>'+
		'</div>';
	$("body").append(html);
	this.jsonBody=window.frames["jsonFormat1"];
	this.closeBut=$("#jsonClose");
	var  jfmt=this;
	this.map={};
	this.format=function(){
		var id,json,jf=this;
		for(var i=0;i<arguments.length;i++){
			var p=arguments[i];
			if(typeof(p)=="string")id=p;
			else json=p;
		}
		try{
			var bd=window.frames["jsonFormat1"];
			var ready_state=bd.status;
			if (ready_state=="success"){
				json=json==null?{}:json;
				jf.map[id]=json;
				bd.setValue(JSON.stringify(jf.map));
			}else{
				setTimeout(function(){
					jfmt.format(id,json);
				},500);
			}
		}catch(e){
		}
	};
};


//需要重写
function MyTip(){
	var html='<div id="myAlert" class="alert alert-success" style="position: absolute;">'+
	   '<a href="#" class="close" data-dismiss="alert">&times;</a>'+
	   '<div type="title" style="margin-right:40px;z-index:99999;">正在加载数据...</div>'+
	   '</div>';
	$("body").append(html);
	$("body").append('<div style="display:none"><form method="post" action="" id="f_load"><input type="submit" /></form></div>');
	this.myAlert=$("#myAlert");
	this.title=this.myAlert.find("[type='title']");
	this.close();
}
MyTip.prototype.show=function(tt){
	if(!isNull(tt)){
		this.title.html(tt);
	}
	this.myAlert.show();
	var h=document.body.clientHeight-this.myAlert.height();
	h=h/2>310||h/2<100?310:h/2;
	var w=(document.body.clientWidth-this.myAlert.width())/2;
	this.myAlert.css({left:w,top:h});
};
MyTip.prototype.close=function(){
	this.myAlert.hide();
};

var myTip=null,jsonFormat=null;
define(function(require,exports){
	myTip=new MyTip();
	jsonFormat=new JSONFormat();
	$("body").bind("keyup",function(evt){
		if(evt.keyCode==119||evt.keyCode==120){
			var isShow=$("#myModal").css("display");
			if(isShow=="none"){
				$("#myModal").modal({keyboard: true});
			}else{
				jsonFormat.closeBut.click();
			}
		}
	});
});

function doOpen() {

}

//获取url参数值
var usrParametesValue=null;	 
function getUrlParameters( name ){
	if(isNull(usrParametesValue)){
		name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
		var regexS = "[\\?&]"+name+"=([^&#]*)";
		var regex = new RegExp( regexS );
		usrParametesValue=regex.exec(window.location.href );
	}
	if( usrParametesValue == null )    return "";  else {
		var a=decodeURI(usrParametesValue[1]);
		var array=a.split("'");
		return array[0];
	}
}