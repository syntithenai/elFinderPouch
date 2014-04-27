if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.send = function(options,fm) {
	console.log('my transport send',options.data);
	
	var d=new $.Deferred();
	//test();	
	//return d;
	
	switch (options.data.cmd) {
		case 'paste' :
		var targets=options.data.targets;
		var dst=options.data.dst;
		var src=options.data.src;
		if (targets && dst && src) {
			var dbsource=pouchTransport.utils.getDatabase(src);
			var dbdest=pouchTransport.utils.getDatabase(dst);
			pouchTransport.tree.getTargets(targets).then(function(targetRecords) {
				pouchTransport.utils.fixNameConflicts(targetRecords,dst).then(function() {
					if (options.data.cut==1 && pouchTransport.utils.volumeFromHash(src)==pouchTransport.utils.volumeFromHash(dst)) {
						console.log('move');
						// just a move, update targets to have new parents
						var promises=[];
						$.each(targetRecords,function(k,record) {
							var dfr=$.Deferred();
							promises.push(dfr);
							record.phash=dst;
							dbsource.put(record,function() {
								dfr.resolve();
							});
						});
						$.when.apply($,promises).then(function() {
							d.resolve({added:targetRecords,removed:targetRecords});
						});
					} else {
						// full copy
						console.log('full copy');
						pouchTransport.tree.getAllFilesAndDirectoriesInside(targets).then(function(records) {
							$.each(records,function(k,fileOrDirectory) {
								console.log('paste record',fileOrDirectory);
								
							});
							d.resolve();
						});
						
					}
				})
			});
		}
		
		break;
	
		case 'archive' :
			console.log('Zip',options.data);
			//console.log('do archive',options.data.targets,type);
			if (options.data.targets) {
				pouchTransport.tree.getAllFilesInside(options.data.targets).then(function(files) {
					pouchTransport.utils.zipFiles(
						files, 
						function(file) {
							return pouchTransport.utils.getAttachment(file.hash);
						},
						function() {console.log('init');},
						function(file) {
							console.log('add',file);
						
						},
						function() {console.log('prgress');},
						function(final) {
							console.log('done',final)
							pouchTransport.utils.mkSomething('mkfile','archive.zip',options.data.dst).then(function(newFile) {
								pouchTransport.utils.putAttachment(newFile.hash,final);
								d.resolve({added:[newFile]});
							});
							
						}
					);
				});
			}
			break;
		
		case 'extract' :
			console.log('unZip',options.data);
			pouchTransport.utils.getAttachment(options.data.target).then(function(attachmentData) {
				pouchTransport.utils.unzipFiles(
					attachmentData,
					function(file) {
						console.log('fileunzipped',file);
					},
					function() {
						console.log('fileunzipped final');
				})
			})
			break;
		case 'tree' :
			pouchTransport.tree.getTree(options.data.target).then(function(items) {
				var ret={tree:items};
				d.resolve(ret);
			});
			break;
		case 'parents' :
			pouchTransport.tree.getParentsWithSiblings(options.data.target).then(function(items) {
				items=pouchTransport.tree.configuredRoots().concat(items);
				var ret={tree:items};
				d.resolve(ret);
			});
			break;
			// parents to root and siblings and siblings of rootline parents
			// returns {tree:[]}
		case 'ls' :
		case 'open' :
			console.log('OPEN',options.data.target,options.data,options);
			// HAVE WE CHOSEN WHERE TO OPEN
			var target=$.trim(options.data.target);
			var ret={};
			
			if (options.data.init) {
				$.extend(ret,
					{"api":"2.0","options": {"archivers": { "create"  : [ "application/zip"],"extract" : ["application/zip"]}}}
				);
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
			pouchTransport.utils.mkSomething(options.data.cmd,options.data.name,options.data.target).then(function(toAdd) {
				var cwd={hash:toAdd.hash};
				if (options.data.cmd=='mkfile') cwd={hash:toAdd.phash};
				var ret={cwd:cwd,added:[toAdd]};
				d.resolve(ret);
			});;
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
				if (bs) {
					var br=new FileReader();
					br.onload=function(data) {
						console.log('GET',data.target.result);
						d.resolve({content:data.target.result});
					}
					br.readAsText(bs);
				// fail to empty default
				} else d.resolve({content:''});
			});
			
			break;
		case 'put' :
			pouchTransport.utils.putAttachment(options.data.target,options.data.content).then(function(response) {
				ret={changed:[response]};
				d.resolve(ret);
			});
			break;
	
		/*case 'tree' :
		
			break;
		
		*/
		default :
			return $.ajax(options);

	}
	return d; 
}
