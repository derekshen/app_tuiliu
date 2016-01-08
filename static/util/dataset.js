var isModify=false;
function Toolbar(){
	this.map={};
	this.toolbar=$("[_class='toolbar']");
	this.click=function(node){};
	this.loop=function(evt){
		this.toolbar.each(function(){
			var id=$(this).attr("id")==null?"*":$(this).attr("id");
			$(this).find("button").each(function(){
				evt(id,$(this));
			});
		});
	};
	this.build=function(){
		var d=this;
		this.toolbar.each(function(){
			$(this).find("button").each(function(){
				$(this).bind("click",function(){d.click($(this));});
			});
		});
	};
	this.build();
	return this;
}
function Dataset(arg){
	this.params={};//传递参	数集合
	this.id=arg.id;             //控件ID -必须有
	this.token=getTokenValue("token");//获得token
	this.modifyDate="";//修改字段名
	this.action=arg.action;         //跳转路径 -必须有
	this.actionQuery=arg.actionQuery;
	this.pageSize=typeof(arg.pageSize)=="undefined"?100:arg.pageSize; //每页显示条数 默认20
	this.pageIndex=1;     //当前页号  默认第一页1
	this.pageTotal=1;     //总页数     默认1页
	this.idField="";      //数据集    主建 (执行查询后，可以获得)
	this.dsLines=[];      //子数据集合 类型 Dataset2
	this.rowMap={};       // key=rowId,value=row
	this.rows=[];         // 数据集的所有行
	this.rowId=0;         //最大的行号，自动增加  doAdd 该值 自动增加，只增不减
	this.allRowCount=0;   //数据总条数
	this.table="";        //表名
	this.addDataset=function(dsLines){this.dsLines=dsLines;};
	this.currentRow={};
	this.oldRows={};
	this.showLoading=typeof(arg.showLoading)=="undefined"?true:arg.showLoading;
	this.showFields=typeof(arg.showFields)=="undefined"?"":arg.showFields;
	this.dblclick=function(rowNode,row){};
	this.click=function(rowNode,row){};
	this._rowsHtml={};
	this._controls=[];
	this._newRow={};
	this.queryId="";
	this.commitMode="change";
	this.beforChange=function(name,row,cellNode,rowNode){return true;};
	var isSelect=false;
	if(typeof(arg.commitMode)=="undefined"){
		if(this.id!="dsData")this.commitMode="all";
	}else this.commitMode=arg.commitMode;
	
	var _controlId=1;
	//-----------给Row-绑定change事件--------------------------
	this._bindRowChange=function(rowNode){
		var dataset=this;
		rowNode.find("[name]").each(function(){
			var node=$(this);
			if(node.is("input")||node.is("textarea")||node.is("select"))node.bind("change",function(){
				var n=node.attr("name");
				var rowId=rowNode.attr("rowid");
				if(rowId==null&&dataset.currentRow!=null)rowId=dataset.currentRow.rowId;
				if(rowId!=null){
					rowId=rowId+"";
					var rr=dataset.rowMap[rowId];
					var isCG=dataset.beforChange(n, rr, node, rowNode);
					var vlu="",vl=rr[n];
					if(node.is("input")&&node.attr("type")=="checkbox"){
						if(isCG)vlu=node.is(":checked")?"1":"0";
						else node.prop("checked",vl=="1"?"checked":false);
					}else if(node.is("input")&&node.attr("type")=="radio"){
						var radio=rowNode.find("input[type='radio'][name='"+n+"']");
						radio.each(function(){
							if(isCG&&$(this).is(":checked"))vlu=$(this).val();
							else if(!isCG&&$(this).val()==vl)$(this).prop("checked",vl=="1"?"checked":false);
						});
					}else{
						if(isCG)vlu=node.val();
						else node.val(vl);
					}
					var isTB=false;
					if(isCG){
						dataset.setModify(true);
						var oldRow={rowId:rowId};
						if(dataset.oldRows[rowId]!=null)oldRow=dataset.oldRows[rowId];
						if(oldRow[n]==null)oldRow[n]=vl;
						dataset.oldRows[rowId]=oldRow;
						rr[n]=vlu;
						if(rr.state=="n"&&n!="select")rr.state="u";
						dataset.put(rowId, rr);
						isTB=true;
						dataset.change(n,rr, node,rowNode,vl);
					}
					if(dataset.currentRow.rowId!=rowId){
						dataset.currentRow=rr;
						dataset.afterScroll(rr);
						isTB=true;
					}
					if(isTB){dataset.jsonToRow(rr,"all");dataset._$evt();}
				}
			});
			var rowId=rowNode.attr("rowid");
			if(rowId==null&&dataset.currentRow!=null)rowId=dataset.currentRow.rowId;
			if(rowId!=null)dataset.change(node.attr("name"), dataset.rowMap[rowId+""], node, rowNode, dataset.rowMap[rowId+""][name]);
		});
	};
	this.setModify=function(isT){
		if(isModify!=isT){
			isModify=isT;
		}
	};
	this._$evt=function(){
		try{
			var dataset=this;
			if(typeof(refreshForm)=="function")refreshForm(dataset);
			if(typeof(afterRefreshForm)=="function")afterRefreshForm(dataset);
		}catch(e){}
	};
	this.buid=function(){
		var dataset=this,arr=[];
		$("[dataset='"+dataset.id+"']").each(function(){
			var _class=$(this).attr("_class");
			var cid=$(this).attr("id");
			var id=isNull(cid)?dataset.id+"_rows_"+(++_controlId):cid;
			$(this).attr("id",id);
			if("rows"==_class){
				var div=$(this).find("[_class='row']").attr("rowid","#{rowId}").attr("pid",id).wrap("<div style='display:none'></div>");
				div.find("[name]").each(function(){
					if($(this).attr("type")!="radio"){
						var name=$(this).attr("name");
						if(!isSelect&&name=="select")isSelect=true;
						if($(this).is("input")){
							$(this).attr("value","#{"+name+"}");
						}else $(this).text("#{"+name+"}");
						dataset._newRow[name]="";
					}
				});
				var html=div.parent().html();
				arr.push({"id":id,"_class":_class,"html":html});
				div.remove();
			}else if("row"==_class){
				arr.push({"id":id,"_class":_class});
				$(this).attr("pid",id);
				dataset._bindRowChange($(this));
				$(this).find("input[type='text']").val("");
			}else if("params"==_class){
				arr.push({"id":id,"_class":_class});
			}
		});
		dataset._controls=arr;
	};
	this.buid();
	if(isSelect)this.commitMode="select";
	
	this._deleteRow=function(row,isDelete){
		if(row==null)return;
		var dataset=this,rs=dataset._controls;
		for(var i=0;i<rs.length;i++){
			var js=rs[i];
			if(js._class=="rows"){
				var prev_id="",next_id="",fed=false,cur_id="";
				$("#"+js.id).find("[_class='row']").each(function(){
					if($(this).attr("rowid")==row.rowId){
						fed=true;
						if(isDelete)$(this).remove();
						else{$(this).addClass("hideNode");}
					}else{
						if($(this).css("display")!="none"){
							if(!fed)prev_id=$(this).attr("rowid");
							if(fed&&next_id=="")next_id=$(this).attr("rowid");
						}
					}
				});
				
				if(row.rowId==dataset.currentRow.rowId){
					cur_id=next_id==""?prev_id:next_id;
					dataset.currentRow=dataset.rowMap[cur_id]==null?{}:dataset.rowMap[cur_id];
					dataset.jsonToRow(dataset.currentRow,"row");
					dataset.afterScroll(dataset.currentRow);
					dataset._$evt();
				}
			}
		}
		if(isDelete)dataset._remove(row.rowId);
	};
	//--------------删除------------
	this.change=function(name,row,cellNode,rowNode,oldValue){};
	this.doDelete=function(ids,evt){
		var dataset=this,rows=[];
		if(typeof(ids)=="string"){
			var paramObj={"action":"/"+dataset.action+"/del/"+ids,"params":dataset.params,"showError":dataset.showError,"showLoading":dataset.showLoading,"queryId":dataset.queryId};
			doAjaxUpdate(paramObj,function(data){
			      jsonFormat.format(dataset.id,{"删除之前":paramObj,"删除返回":data});
				if (data.status=="1"){
			    	   for(var s in dataset.rowMap){
			    		   var row=dataset.rowMap[s];
			    		   var id=row[dataset.idField];
			    		   if(!isNull(id)&&(","+ids+",").indexOf(","+id+",")!=-1){
			    			   rows.push(row);
			    			   dataset._deleteRow(row,true);
			    		   }
			    	   }
			    	   if(typeof(evt)=="function")evt(rows); 
			    	}
			 });
		}else if(typeof(ids)!="undefined"&&typeof(ids.length)=="number"){
			rows=ids;
			var arrs=[];
			for(var i=0;i<rows.length;i++){
				var r=rows[i];
				if(r.state!="i"){
					arrs.push(r[dataset.idField]);
				}else{ dataset._deleteRow(r,true);}
			}
			if(arrs.length>0)dataset.doDelete(arrs.join(","), evt);
		}else if(typeof(ids)=="undefined"||typeof(ids.rowId)!="undefined"){
			var row=typeof(ids)=="undefined"?dataset.currentRow:ids;
			if(row==null||isNull(row.rowId))return;
			if(row.state!="i"){
				var paramObj={"action":"/"+dataset.action+"/del/"+row[dataset.idField],"params":dataset.params,"showError":dataset.showError,"showLoading":dataset.showLoading,"queryId":dataset.queryId};
				doAjaxUpdate(paramObj,function(data){
				       if (data.status=="1"){
				    	   jsonFormat.format(dataset.id,{"删除之前":paramObj,"删除返回":data});
				    	   if(typeof(evt)=="function")evt(row); 
				    	   dataset._deleteRow(row,true);
				       }
				});
			}else{
				dataset._deleteRow(row,true);
			}
		}
	};
	this.doRemove=function(row){
		var r=row;
		if(typeof(row)=="undefined")r=this.currentRow;
		if(r.state!="i"){
			r.state="d";
			this.put(r.rowId, r);
		}
		this._deleteRow(r,false);
		this.setModify(true);
	};
	this.doCancel=function(){
		try{
			var dataset=this;
			var row=dataset.oldRows;
			for(var rid in row){
				var cr=row[rid];
				var r1=dataset.get(rid);
				for(var s in cr){
					r1[s]=cr[s];
				}
				dataset.put(rid, r1);
			}
			for(var rowId in dataset.rowMap){
				var r=dataset.rowMap[rowId];
				if(r.state=="i"){dataset._deleteRow(r,true);dataset._remove(rowId);}
				else{r.state="n";}
				dataset.put(rowId, r);
			}
			dataset.showDeleteRow();
			dataset.jsonToRows();
			dataset.oldRows={};
			dataset.setModify(false);
		}catch(e){}
	};
	//--------------清空数据---------
	this.clearData=function(){
		var dataset=this;
		if(arguments.length==0){
			var arr=dataset._controls;
			for(var i=0;i<arr.length;i++){
				var js=arr[i];
				if(js._class=="rows"){$("#"+js.id).find("[_class='row']").remove();
				}else if(js._class=="row"){$("#"+js.id).find("input[type='text']").val("");}
			}
			dataset.rowMap={};
			dataset.rows=[];
			dataset.oldRows={};
			for(var x=0;x<dataset.dsLines.length;x++){dataset.dsLines[x].clearData();}
		}else{
			var t=arguments[0];
			if(typeof(t.length)=="undefined")dataset._deleteRow(t, true);
			else{
				for(var i=0;i<t.length;i++){
					var r=t[i];
					dataset._deleteRow(r, true);
				}
			}
		}
	};
	//------------下一页----------
	this.isAppendPage=false;
	this.nextPage=function(){
		this._isExport=false;
		this._appendData=true;
		var evt=null;
		for(var i=0;i<arguments.length;i++){
			var p=arguments[0];
			if(typeof(p)=="boolean")this.isAppendPage=p;
			else if(typeof(p)=="function")evt=p;
		}
		if(this.pageIndex*1==this.pageTotal*1){alert("已是尾页");return false;}
		this.pageIndex=this.pageIndex*1+1;
		this._executeQuery(evt);
	};
	//上一页
	this.prevPage=function(evt){
		this._isExport=false;
		var evt=null;
		for(var i=0;i<arguments.length;i++){
			var p=arguments[0];
			if(typeof(p)=="boolean")this.isAppendPage=p;
			else if(typeof(p)=="function")evt=p;
		}
		if(this.isAppendPage)return;
		if(this.pageIndex<=1){alert("已是首页");return false;}
		this.pageIndex=this.pageIndex*1-1;
		this._executeQuery(evt);
	};
	this.bindRowsEvent=function(r){
		if(r._class!="rows")return;
		var dataset=this;
		var rowArray=$("#"+r.id).find("[_class='row']");
		rowArray.each(function(i){
			var isBand=$(this).attr("isbandevt");
			if(isBand!="true"){
				var cuRow=$(this);
					cuRow.attr("isbandevt","true");
					cuRow.bind("click",function(){
						var rowId=$(this).attr("rowid"),rr=dataset.rowMap[rowId];
						if(dataset.currentRow==null||dataset.currentRow.rowId!=rowId){
							rowArray.removeClass("currentRow");
							cuRow.addClass("currentRow");
							dataset.currentRow=rr;
							dataset.afterScroll(rr);
							dataset.jsonToRow(rr,"row");
							dataset._$evt();
						}
						dataset.click($(this), rr);
					}).bind("dblclick",function(){
						var rowId=$(this).attr("rowid"),rr=dataset.rowMap[rowId];
						dataset.dblclick($(this),rr);
					});
					dataset._bindRowChange($(this));
			}
		});
	};

	//增行
	this.doAdd=function(data){
		var dataset=this;
		var rowId=(++dataset.rowId)+"";
		var newRow={};
		if(!isNull(dataset._newRow)){for(var f in dataset._newRow){newRow[f]=dataset._newRow[f];}}
		if(!isNull(data)){
			for(var f in data){
				newRow[f]=data[f];
			}
		}
		newRow.rowId=rowId;
		newRow.state="i";
		dataset.put(rowId, newRow);
		var row=dataset.rowMap[rowId];
		var arr=dataset._controls;
		for(var i=0;i<arr.length;i++){
			var js=arr[i];
			if(js._class=="rows"){
				var h=dataset.getRowHtml(js.id,row);
				var html=h!=null?h:js.html;
				for(var rv in row){
					html=html.replace(eval("/#{"+rv+"}/gi"),isNull(row[rv])?"":row[rv]);
				}
				html=replaceValue(html);
				$("#"+js.id).append(html);
				$("#"+js.id).find("input[type='checkbox']").each(function(){
					$(this).prop("checked",$(this).attr("value")=="1"?"checked":false);
				});
				dataset.bindRowsEvent(js);
			}
		}
		dataset.currentRow=row;
		dataset.jsonToRow(row,"all");
		dataset.afterScroll(row);
		dataset._$evt();
		dataset.setModify(true);
	};
	this.set=function(row){
		if(this.currentRow.rowId==null){
			alert(this.id+"没有数据");
			return;
		}
		if(row.rowId==null){
			alert("传入的数据中没有rowId");
			return ;
		}
		var r=this.rowMap[row.rowId];
		if(r==null){
			alert("没有找到"+row.rowId+"数据");
			return ;
		}
		var old=this.oldRows[row.rowId+""];
		for(var p in row){
			if(r[p]!=row[p]){
				if(old==null)old={"rowId":row.rowId};
				if(old[p]==null)old[p]=r[p];
			}
			r[p]=row[p];
		}
		if(old!=null)this.oldRows[row.rowId+""]=old;
		this.put(row.rowId, r);
		this.jsonToRow(r,"all");
	};
	this.refresh=function(){
		this.put(this.currentRow.rowId, this.currentRow);
		this.jsonToRow(this.currentRow,"all");
	};
	this.copyRow=function(row){
		this.doAdd();
		var r=this.currentRow;
		for(var p in row){
			if(p==null||p=="rowId")continue;
			r[p]=row[p];
		}
		if(this.idField!="")r[this.idField]="";
		this.put(r.rowId, r);
		this.jsonToRow(r,"all");
	};
	this.afterScroll=function(row){};
	//保存
	this.doSave=function(evt){//保存
		var ds=this;
		var datasets={},rs=ds.getRows(ds.commitMode);
		if(ds.id=="dsData")datasets={"dsData":{"rows":rs}};
		else datasets={"dataset":{"rows":rs}};
		if(rs.length==0){return;}
		for(var x=0;x<ds.dsLines.length;x++){
			var ds_line=ds.dsLines[x];
			datasets[ds_line.id]={};
			datasets[ds_line.id].rows=ds_line.getRows(ds_line.commitMode);
		}
		  doAjaxUpdate({"action":"/"+ds.action+"/save","datasets":datasets,"params":ds.params,"showError":ds.showError,"showLoading":ds.showLoading,"queryId":ds.queryId},function(data){
		    if(data.status=="1")ds.oldRows={};
			ds.jsonToUI(data,false);
		    jsonFormat.format(ds.id,{"保存之前":datasets,"保存结果":data});
		    if(typeof(evt)=="function"&&data.status=="1")evt();
		  });
	};
	this.getRows=function(state){
		var dataset=this,rs=[];
		if(state=="current"){
			rs.push(dataset.currentRow);
			return rs;
		}
		for(var r in dataset.rowMap){
			if(dataset.rowMap[r]==null)continue;
			var row=dataset.rowMap[r];
			if(state=="select"){
				if(row.select==true||row.select=="1")rs.push(row);
			}else if(state=="all"){ 
				rs.push(row);
			}else if(state=="change"){ 
				if(row.state=="n")continue;
				if(row.state=="i")rs.push(row);
				else if(row.state=="d"){
					var nr={rowId:row.rowId};
					nr[dataset.idField]=row[dataset.idField];
					nr[dataset.modifyDate]=row[dataset.modifyDate];
					nr.state="d";
					rs.push(nr);
				}else{
					var oldR=dataset.oldRows[row.rowId];
					var nr={rowId:row.rowId,state:"u"};
					nr[dataset.idField]=row[dataset.idField];
					nr[dataset.modifyDate]=row[dataset.modifyDate];
					if(oldR!=null){
						for(var s in row){
							if(oldR[s]==null||oldR[s]==row[s])continue;
							nr[s]=row[s];
						}
					}
					rs.push(nr);
				}
			}
		}
		return rs;
	};
	this._appendData=false;
	this._executeQuery=function(evt){
		var md=this,arr=md._controls;
		if((!md.isAppendPage||!md._appendData)&&!md._isExport){md.clearData();}
		var params={};
		for(var i=0;i<arr.length;i++){
			var json=arr[i];
			if(json._class=="params"){
				$("#"+json.id).find("[name]").each(function(){
					var vl="",node=$(this);
					if(node.is("input")&&node.attr("type")=="radio"){if(node.is(":checked"))vl=node.val();}
					else if(node.is("input")&&node.attr("type")=="checkbox"){
						vl=node.is(":checked")?"1":"0";
					}else vl=node.val();
					if(!isNull(vl)){
							params[node.attr("name")]=vl;
					}
				});
			}
		}
		
		if(!isNull(md.params)){
			for(var p in md.params){
				params[p]=md.params[p];
			};
		};
		var beforParam={"action":md.actionQuery!=null?md.actionQuery:"/"+md.action+"/query",
			"params":params,
			"pageIndex":md.pageIndex,
			"pageSize":md.pageSize,
			"showError":md.showError,
			"showLoading":md.showLoading,
			"showFields":md.showFields,
			"rowId":md.rowId,
			"queryId":md.queryId
		};
		if(md._isExport){
			beforParam.action=beforParam.action.replace("/query","/export/query");
		}
		doAjaxQuery(beforParam,
			function(data){
				jsonFormat.format(md.id,{"查询条件":beforParam,"查询结果":data});
		    	if(data.status=="1"&&!md._isExport){
		    		md.jsonToUI(data,true);
		    	}
		        md.status=data.status;
		        md.token=data.token;
		        if(typeof(evt)=="function"&&data.status=="1")evt(data);
		      }
		    );
		this.setModify(false);
	};
	//查询
	this.doQuery=function(evt){//查询
		this.pageIndex=1;
		this._appendData=false;
		this._isExport=false;
		this._executeQuery(evt);
	};
	this._isExport=false;
	this.doExport=function(evt){
		this._isExport=true;
		this._executeQuery(evt);
	};
	this.getRowHtml=function(id,row){};
	//json 数据同步到界面上
	this.jsonToUI=function(data,isQuery){
		try{
			var dataset=this;
		    if(data.datasets==null && data["dataset"]==null)return;
		    var rows;
		    var dst= (data["dataset"]==null?data.datasets["dsData"]:data["dataset"]);
		    rows=dst.rows;
	    	if(isQuery)dataset.rowId=dst.rowId;
	    	if(isNull(dataset.idField))dataset.idField=dst.idField;
	    	if(isNull(dataset.modifyDate))dataset.modifyDate=dst.modifyDate;
	    	dataset.pageTotal=dst.pageTotal;
	    	if(isNull(dataset.table))dataset.table=dst.table;
	    	dataset.allRowCount=dst.allRowCount;
	    	dataset.queryId=dst.queryId;
		    
		    if(rows==null||rows.length==0)return;
		    if(isQuery==true){
		    	for(var x=0;x<rows.length;x++){
		    		var row=rows[x];
		    		row.state="n";
		    		dataset.rowMap[row.rowId+""]=row;
		    	}
		    	if(!dataset.isAppendPage||!dataset._appendData){
		    		dataset.rows=rows;
		    		dataset.currentRow=rows[0];
		    	}else{
		    		for(var j=0;j<rows.length;j++){
		    			dataset.rows.push(rows[j]);
		    		}
		    	}
		    }else{
		    	for(var x=0;x<rows.length;x++){
		    		var row=rows[x];
		    		var oldR=dataset.get(row.rowId);
		    		if(oldR!=null){
			    		for(var s in row){
			    			oldR[s]=row[s];
			    		}
			    		dataset.put(row.rowId, oldR);
		    		}else{
		    			dataset.put(row.rowId, row);
		    		}
		    	}
		    }
			var ct=dataset._controls;
			if(ct==null||ct.length==0)return;
			for(var m=0;m<ct.length;m++){
				var r=ct[m];
				if(r==null||r._class==null)continue;
				if(r._class=="rows"){
					if(isQuery==true){
						var arrHtml=[];
						for(var i=0;i<rows.length;i++){
							var row=rows[i];
							var h=dataset.getRowHtml(r.id,row);
							var html=h==null?r.html:h;
							for(var rv in row){
								html=html.replace(eval("/#{"+rv+"}/gi"),isNull(row[rv])?"\'\'":row[rv]);
							}
							html=replaceValue(html);
							arrHtml.push(html);
						}
						if(!dataset.isAppendPage||!dataset._appendData)$("#"+r.id).find("[_class='row']").remove();
						$("#"+r.id).append(arrHtml.join(""));
						$("#"+r.id).find("[name]").each(function(){
							var node=$(this);
							if(node.is("input")&&node.attr("type")=="checkbox")node.prop("checked",node.attr("value")=="1"?"checked":false);
							if(!node.is("input")&&!node.is("textarea")&&node.text()=="''")node.text("");
						});
					}else{
						$("#"+r.id).find("[_class='row']").each(function(){
							var rowId=$(this).attr("rowid");
							for(var i=0;i<rows.length;i++){
								var row=rows[i];
								if(rowId==row.rowId){
									$(this).find("[name]").each(function(){
										if($(this).attr("type")!="radio"){
											var n=$(this).attr("name");
											if(typeof(row[n])!="undefined"&&$(this).is("input"))$(this).val(isNull(row[n])?"":row[n]);
											else if(typeof(row[n])!="undefined"&&!$(this).is("input"))$(this).text(isNull(row[n])?"":row[n]);
										}
									});
									
								}
							}
						});
					}
					dataset.bindRowsEvent(r);
				}
			}
			dataset.jsonToRow(dataset.currentRow,"row");
			if(isQuery){
				dataset.afterScroll(dataset.currentRow);
				dataset._$evt();
			}
		  }finally{
		  }
	};
	/*----------当前行同步------------
	 * row  Datasetl里面rows 数据
	 * class_id 页面属性 id
	 */
	this.jsonToRow=function(row,type){//同步
		var dataset=this;
		if(row==undefined)return;
		var ct=dataset._controls;
		if(ct==null||ct.length==0)return;
		for(var m=0;m<ct.length;m++){
			var r=ct[m];
			if(r==null||r._class==null||r==undefined)continue;
			if(r._class=="row"&&type!="rows"){
				dataset._setValueToWeb($("#"+r.id), row);
			}else if(r._class=="rows"&&type!="row"){
				var rs=$("#"+r.id).find("[_class='row']");
				rs.removeClass("currentRow");
				rs.each(function(){
					if($(this).attr("rowid")==row.rowId){
						$(this).addClass("currentRow");
						dataset._setValueToWeb($(this), row);
					}
				});
			}
		}
	};
	

	this.getField=function(f,evt){
		var dataset=this;
		var ct=dataset._controls;
		if(ct==null||ct.length==0)return;
		for(var m=0;m<ct.length;m++){
			var r=ct[m];
			if(r._class!="rows"&&r._class!="row")continue;
			var rowNodes=r._class=="row"?$("#"+r.id):$("#"+r.id).find("[_class='row']");
			rowNodes.each(function(){
				var pid=$(this).attr("pid"),rowId=$(this).attr("rowid");
				if(rowId==null)rowId=dataset.currentRow.rowId;
					$(this).find("[name]").each(function(){
						var node=$(this),n=node.attr("name");
						if(node.is("input")||node.is("textarea")||node.is("select")){
							if(f=="all"||(","+f+",").indexOf(","+n+",")!=-1){
								evt(pid,n,node,dataset.rowMap[rowId]);
							}
						}
					});
			});
		}
	};
	this.setReadOnly=function(){
		var id=arguments.length==3?arguments[0]:"*";
		var f=arguments.length==2?arguments[0]:arguments.length==3?arguments[1]:"all";
		var t=arguments[arguments.length-1];
		var dataset=this;
		dataset.getField(f, function(controlId,name,node,row){
			if(id=="*"||id==controlId)node.prop("disabled",t);
		});
	};
	this.jsonToRows=function(){//同步
		var dataset=this;
		if(dataset.rows.length==0)return;
		dataset.currentRow=dataset.rows[0];
		var ct=dataset._controls;
		if(ct==null||ct.length==0)return;
		for(var m=0;m<ct.length;m++){
			var r=ct[m];
			if(r==null||r._class==null||r==undefined)continue;
			if(r._class=="row"){
				dataset._setValueToWeb($("#"+r.id), dataset.rows[0]);
			}else if(r._class=="rows"){
				var rs=$("#"+r.id).find("[_class='row']");
				rs.removeClass("currentRow");
				rs.each(function(){
					if($(this).attr("rowid")==dataset.currentRow.rowId){
						$(this).addClass("currentRow");
					}
						dataset._setValueToWeb($(this), dataset.rowMap[$(this).attr("rowID")]);
				});
			}
		}
	};
	
	this.showDeleteRow=function(){//同步
		var dataset=this,rs=dataset._controls;
		for(var i=0;i<rs.length;i++){
			var js=rs[i];
			if(js._class=="rows"){
				$("#"+js.id).find("[_class='row']").each(function(){
					if($(this).css("display")=="none"){
						 $(this).removeClass("hideNode");
					}
				});
			}
		}
	};
	this._getParentNode=function(node,_class){
		var dataset=this.id;
		var nd=node;
		for(var i=0;i<20;i++){
			if(dataset!=null&&nd.attr("dataset")==dataset&&nd.attr("_class")==_class){break;}
			else if(dataset==null&&nd.attr("_class")==_class)break;
			else nd=nd.parent();
		}
		return nd;
	};
	this._setValueToWeb=function(rowNode,row){
		var dataset=this;
		try{
			if(rowNode.css("display")=="none")return;
			rowNode.find("[name]").each(function(){
					var node=$(this),n=node.attr("name");
					if(node.is("input")){
						if(node.attr("type")=="checkbox"){
							if(typeof(row[n])!="undefined"&&(row[n]=="1"||row[n]==true))node.prop("checked","checked");
							else node.removeAttr("checked");
						}else if(node.attr("type")=="radio"){
							node.prop("checked",node.attr("value")==row[n]);
						}else node.val(row[n]);
					}else if(node.is("select")){
						node.find("option").each(function(){
							$(this).prop("checked",row[n]==$(this).val()?"checked":false);
						});
					}else{
						node.text(isNull(row[n])?"":row[n]);
					}
					if(rowNode.attr("rowid")==null)dataset.change(n, row, node, rowNode, row[name]);
			});
		}catch(e){}
	};
	
	return this;
};
Dataset.prototype.put = function(key, object) {
    if (key == null) return;
    key=key+"";
    var array = this.rows;
    var objects = this.rowMap;
    var $2 = objects[key];
    if (typeof ($2) == "undefined") {
        array.push(object);
    } else {
        var i = this.indexOf($2);
        if (i >= 0) {
            array[i] = object;
        }
    }
    objects[key] = object;
};
Dataset.prototype._remove = function(key) {
    var array = this.rows;
    var objects = this.rowMap;
    var oldObj=this.oldRows;
    var $2 = null;
    key = key+"";
    $2 = objects[key];
    delete objects[key];
    delete oldObj[key];
    var i = this.indexOf($2);
    if (i >= 0) {
        array.splice(i, 1);
    }
    return $2;
};
Dataset.prototype.get = function(key) {
   return this.rowMap[key+""];
};
Dataset.prototype.indexOf =function($r) {
    var $2 = this.rowMap[$r];
    if ($2 != null) {
    	var j=-1;
    	for(var i=0;i<this.rows.length;i++){
    		if(this.rows[i].rowId==$2.rowId){
    			j=i;
    			break;
    		}
    	}
       return j;
    } else {
        return -1;
    }
};
Dataset.prototype.showError=function(e){
	alert(e);
	//需要重写
};
function replaceValue(html){
	while(html.indexOf("#{")!=-1){
		var i=html.indexOf("#{");
		var h2=html.substring(i,html.length);
		var h3=h2.substring(0,h2.indexOf("}")+1);
		html=html.replace(eval("/"+h3+"/gi"),"");
	}
	return html;
}

	