define(function(require,exports){
		
//发送验证码
	$("#doSend").bind("click",function(){
	var dsData=new Dataset({"id":"dsData","action":"user"});
	var phonenumnber = $("#phonenumnber").val();
		dsData.actionQuery="/user/msg/"+phonenumnber+"";
		dsData.doQuery(function(){
			//发送成功
			alert("验证码已发送至您的手机，请查收")
		});
	});

//提交注册信息
	$("#doRegister").bind("click",function(){
		var dsDatacheck=new Dataset({"id":"dsData","action":"user"});
		var phonenumnber = $("#phonenumnber").val();
		dsDatacheck.actionQuery="/user/checkMobile/"+phonenumnber+"/TMS";
		dsDatacheck.doQuery(function(){
		if (dsDatacheck.allRowCount == 0){
				//未注册
			var dsData=new Dataset({"id":"dsData","action":"user"});
			var phonenumnber = $("#phonenumnber").val();
			var phonecode = $("#phonecode").val();
			dsData.actionQuery="/user/register/"+phonenumnber+"/"+phonecode+"/dbcon/TMS/*";
				dsData.doQuery(function(){
					alert("注册成功")
					window.location="sec/user.html";
				});
		}else{
			//已注册
			alert("已注册")
			}
		});
	});
	$(".register").find("input").each(function(){
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