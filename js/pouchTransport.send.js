if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.send = function(options,fm) {
	console.log('my transport send',options.data);
	
	var d=new $.Deferred();
	//test();	
	//return d;
	
	switch (options.data.cmd) {
		case 'archive' :
			console.log('Zip',options.data)
		case 'extract' :
			console.log('unZip',options.data)
		case 'tree' :
			pouchTransport.tree.getTree(options.data.target).then(function(items) {
				var ret={tree:items};
				d.resolve(ret);
			});
		case 'parents' :
			pouchTransport.tree.getParentsWithSiblings(options.data.target).then(function(items) {
				items=pouchTransport.tree.configuredRoots().concat(items);
				var ret={tree:items};
				d.resolve(ret);
			});
			
			// parents to root and siblings and siblings of rootline parents
			// returns {tree:[]}
		case 'ls' :
		case 'open' :
			console.log('OPEN',options.data.target,options.data,options);
			// HAVE WE CHOSEN WHERE TO OPEN
			var target=$.trim(options.data.target);
			var ret={};
			
			if (options.data.init) {
				$.extend(ret,{api:"2.0"});
				if (target.length == 0) {
					target=pouchTransport.utils.volumeFromHash(target)+'_filesystemroot';
				}
			}
			pouchTransport.tree.getChildren(target).then(function(items) {
				console.log('SSSSSSSSSSSSSSSload child dir',items);
				if (pouchTransport.utils.keyFromHash(target)=='filesystemroot')  {
					pouchTransport.tree.getRootsAndSubfolders().then(function(rootsAndSubfolders) {
						ret.files=items; //$.extend([],pouchTransport.tree.mashResults(items.concat(rootsAndSubfolders)));
						console.log('RSF',rootsAndSubfolders,target,items);
						$.each(rootsAndSubfolders,function(key,value) {
							if (value.hash==target) ret.cwd=value;
						});
						if (!ret.cwd) ret.cwd=rootsAndSubfolders[0];
						var a=JSON.stringify(ret);
						reti=JSON.parse(a);
						console.log('resolveroot',reti,a);
						d.resolve(reti);
					});
				} else if (options.data.tree) {
					pouchTransport.tree.getRootsAndSubfolders().then(function(rootsAndSubfolders) {
						
						ret.files=pouchTransport.tree.mashResults(items.concat(rootsAndSubfolders));
						$.each(rootsAndSubfolders,function(key,value) {
							if (value.hash==target) ret.cwd=value;
						});
						if (!ret.cwd) {
							pouchTransport.tree.getTarget(target).then(function(val) {
								
									ret.cwd=val[0];
							});
						}
						if (!ret.cwd) ret.cwd=rootsAndSubfolders[0];
						console.log('resolveopen tree',ret)
						d.resolve(ret);
					});
				} else {
					ret.files=pouchTransport.tree.mashResults(items);
					pouchTransport.tree.getTarget(target).then(function(val) {
							ret.cwd=val[0];
							console.log('resolveopen',ret,items)
							d.resolve(ret);
					});
				}
			});
				
			break;
		case 'mkfile' :
		case 'mkdir' :
		//	console.log('MK??',options.data)
			
			if (options.data.name && options.data.target) {
			//	console.log('MK have pars')
			
				var toAdd={
					name: options.data.name,
					phash : options.data.target,
					locked : 0,
					mime : 'directory',
					type : 'directory',
					read : 1,
					write:1,
					size :0,
					ts:Date.now()
				};
				if (options.data.cmd=='mkfile') {
					// TODO set mime by file extension
					toAdd.mime=MimeConverter.lookupMime(toAdd.name);
					toAdd.type='file';
				} 
				var db=pouchTransport.utils.getDatabase(toAdd.phash);
			//	console.log('MK ',toAdd,db)
				if (db) {
					db.post(toAdd,function(err,postResponse) {
						if (err) {
							console.log('ERROR',err);
						} else {
							toAdd._id=postResponse.id;
							toAdd._rev=postResponse.rev;
							toAdd.hash=pouchTransport.utils.volumeFromHash(options.data.target)+'_'+toAdd._id;
							db.put(toAdd,function(err,putResponse) {
								if (err) {
									console.log('ERROR',err);
									d.reject();
								} else {
									var cwd={hash:toAdd.hash};
									if (options.data.cmd=='mkfile') cwd={hash:toAdd.phash};
									var ret={cwd:cwd,added:[toAdd]};
									d.resolve(ret);
								}
							});
						}
					});
				}
			}
			break;
		case 'rename' :
			//console.log('rename');
			if (options.data.name && options.data.target) {
				var db=pouchTransport.utils.getDatabase(options.data.target);
				if (db) {
					db.get(pouchTransport.utils.keyFromHash(options.data.target)).then(function(target) {
						target.name=options.data.name;
						target.ts=Date.now();
						target.mime=MimeConverter.lookupMime(target.name);
						//console.log('new target ',target);
						db.post(target).then(
							function(res) {  
								//console.log('dne ren',res); 
								d.resolve({added:[target],removed:[target.hash]}); 
							}
						);
					});
				}
			}
			break;
		case 'rm' :
			console.log('RM',options.data);
			if (options.data.targets) {
				$.when.apply($,function() {
					var deferreds=[];
					$.each(options.data.targets,function(key,val) {
					console.log('RMt',val);
							
						var df=new $.Deferred();
						var db=pouchTransport.utils.getDatabase(val);
						if (db) {
							db.get(pouchTransport.utils.keyFromHash(val),function(err,target) {
								if (err) {
									console.log('ERROR',err);
									d.reject();
								} else {
									console.log('RM have obj',target);
									pouchTransport.tree.getAllChildren(val).then(function(children) {
										console.log('RM have kids',children);
									
										$.each(children,function(cKey,child) {
											db.remove(child)
										});
										console.log('RM have kids d');
										db.remove(target,function(err,doc) {
											if (err) {
												console.log('ERROR',err);
												d.reject();
											} else {
												df.resolve();
											}
										});
									});
								}
							});
						}
						deferreds.push(df);
					});
					return deferreds;
				}()).then(
					function() {  
						d.resolve({removed:options.data.targets}); 
					}
				);
			}
			break;
		case 'duplicate' :
			// TODO - what about folders RECURSIVE
			var createFiles=function() {
				var deferreds=[];
				$.each(options.data.targets,function(key,val) {
					var df=new $.Deferred();
					var db=pouchTransport.utils.getDatabase(val);
					if (db) {
						db.get(pouchTransport.utils.keyFromHash(val),function (err,oval) {
							var val=JSON.parse(JSON.stringify(oval));
							delete val._id;
							delete val._rev;
							delete val.hash;
							db.post(val,function(err,resp) {
								val.hash=pouchTransport.utils.volumeFromHash(val)+'_'+val._id;
								var parts=$.trim(val.name).split(".");
								if (parts.length>1) val.name=parts.slice(0,parts.length-1).join(".")+"-"+val._id+'.'+parts[parts.length-1];
								else val.name=val.name+"-"+val._id;
								//val._rev=resp.rev;
								db.put(val,function(err,ffresponse) {
									db.getAttachment(pouchTransport.utils.keyFromHash(val),'fileContent',ffresponse.rev,function(err,aresp) {
										db.put
									});
									df.resolve(val);
								});
							});
						});
					}
					deferreds.push(df);
				});
				return deferreds;
			}
			if (options.data.targets) {
				$.when.apply($,createFiles()).then(
					function(res) {  
						d.resolve({added:[res]}); 
					}
				);
			} 
			break;
		case 'search' :
			// TODO HMMM SEARCH WHERE ? MULTI ROOT SEARCH
			var db=pouchTransport.utils.getDatabase(options.data.target);
					
			if (db && options.data.q) {
				q=options.data.q;
				//console.log('seasrch',q);
						
				db.query(
					function(d) {
						if (d.type=='file' || d.type=='directory') {
							//if (d.name.indexOf(options.data.q)!==-1) {
								emit(d.name,d);
							//	}
						}
					},
					{startkey:q ,endkey:q+"\ufff0"},
					function(err,response) {
						//console.log('Done',response.rows);
						var searchResults=[];
						$.each(response.rows,function(key,val) {
							searchResults.push(val.value);
						});
						var ret={files:searchResults}; //JSON.parse(JSON.stringify(response.rows))};
						//console.log(ret);
						// btween prev log and resolving files array vanishes ????
						d.resolve(ret);
					});
			}
			break;
		case 'get' :
			pouchTransport.utils.getAttachment(options.data.target).then(function(bs) {
				d.resolve({content:bs});
			});
			
			break;
		case 'put' :
			var db=pouchTransport.utils.getDatabase(options.data.target);
			// TODO set file size
			if (db && options.data.target && options.data.content) {
				db.get(pouchTransport.utils.keyFromHash(options.data.target),function(err,response) {
					response.size=options.data.content.length;
					response.ts=Date.now();
					db.put(response,function(err,putResponse) {
						db.putAttachment(pouchTransport.utils.keyFromHash(options.data.target),'fileContent',response._rev,new Blob([options.data.content]),response.mime,function(err,attResponse) {
							d.resolve({changed:[response]});
						});
					});
				});
			}
			break;
		case 'paste' :
			var db=pouchTransport.utils.getDatabase(options.data.target);
					
			if (options.data.target && options.data.dst && options.data.src) {
				var dbsource=pouchTransport.utils.getDatabase(options.data.target);
				var dbdest=pouchTransport.utils.getDatabase(options.data.dst);
				var deferreds=[];
				$.each(options.data.targets,function(key,val) {
					var df=new $.Deferred();
					// easy case update parent references
					if (options.data.cut) {
						db.get(pouchTransport.utils.keyFromHash(val),function (err,oval) {
							oval.phash=options.data.dst;
							db.put(oval,function(err,response) {
								df.resolve(oval);
							});
						});
					// otherwise we have to recursively copy all the selected elements
					} else {
						
					}
					deferreds.push(df);
				});
				return deferreds;
			}
			if (options.data.targets) {
				$.when.apply($,createFiles()).then(
					function(res) {  
						d.resolve({added:[res]}); 
					}
				);
			} 
			
			break;
		
		/*case 'tree' :
		
			break;
		
		*/
		default :
			return $.ajax(options);

	}
	return d; 
}
