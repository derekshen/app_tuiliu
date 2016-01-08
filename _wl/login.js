define(function(require,exports){

	var token=getTokenValue("token");
	if(token!=null&&token!="null"){window.location="sec/user.html";return;}

	var dsData=new Dataset({id:"dsData",actionQuery:"/user/login"});
	$("#doLogin").bind("click",function(){
		dsData.doQuery(function(data){
			var row=data.dataset.rows[0];
			for(var key in row){
				setTokenValue(key,row[key]); //保存到PC或手机上
			}
			setTokenValue("token",dsData.token);
			setTokenValue("isSave",$("#isSave").is(":checked")?"true":"false");
			window.location="sec/user.html";
		});
	});
	

	$(".login").find("input").each(function(){
		var n=$(this).attr("name");
		var vl= getTokenValue(n);
		if(n=="userId"){
			$(this).val(vl==null?"":vl);
		}else if(n=="userPWD"){
			$(this).val(getTokenValue("isSave")=="true"&&!isNull(getTokenValue("userPWD"))?getTokenValue("userPWD"):"");
		}else if(n=="isSave"){
			$(this).attr("checked",getTokenValue("isSave")=="true"?"checked":false);
		}
	});
	
});