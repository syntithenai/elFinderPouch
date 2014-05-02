if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.send = function(options,fm) {
	console.log('my transport send',options.data);
	
	var d=new $.Deferred();
	//test();	
	//return d;
	
	switch (options.data.cmd) {
		case 'duplicate' :
		case 'paste' :
		if (options.data.cmd=='duplicate') {
			console.log('DUP');
			if (options.data.targets[0]) {
				console.log('set from first',options.data.targets[0]);
				pouchTransport.tree.getTarget(options.data.targets[0]).then(function(record) {
						console.log('got first first',record[0].phash,record);
					pouchTransport.tree.paste(options.data.targets,record[0].phash,record[0].phash,options.data.cut).then(function(res) {
						d.resolve(res);
					});
				});
			}
		} else {
			pouchTransport.tree.paste(options.data.targets,options.data.src,options.data.dst,options.data.cut).then(function(res) {
				d.resolve(res);
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
							// TODO more interesting filename - single folder/filename -> easy otherwise <parentfoldername>-selection.zip
							pouchTransport.utils.mkSomething('mkfile','archive.zip',options.data.dst,final).then(function(newFile) {
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
			pouchTransport.tree.getChildFolders(options.data.target).then(function(items) {
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
			//console.log('OPEN',options.data.target,options.data,options);
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
				//console.log('SSSSSSSSSSSSSSSload child dir',items);
				if (pouchTransport.utils.keyFromHash(target)=='filesystemroot')  {
					pouchTransport.tree.getRootsAndSubfolders().then(function(rootsAndSubfolders) {
						ret.files=items; //$.extend([],pouchTransport.tree.mashResults(items.concat(rootsAndSubfolders)));
						//console.log('RSF',rootsAndSubfolders,target,items);
						$.each(rootsAndSubfolders,function(key,value) {
							if (value.hash==target) ret.cwd=value;
						});
						if (!ret.cwd) ret.cwd=rootsAndSubfolders[0];
						var a=JSON.stringify(ret);
						reti=JSON.parse(a);
						//console.log('resolveroot',reti,a);
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
						//console.log('resolveopen tree',ret)
						d.resolve(ret);
					});
				} else {
					ret.files=pouchTransport.tree.mashResults(items);
					pouchTransport.tree.getTarget(target).then(function(val) {
							ret.cwd=val[0];
							//console.log('resolveopen',ret,items)
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
			console.log('rename');
			if (options.data.name && options.data.target) {
				var db=pouchTransport.utils.getDatabase(options.data.target);
				if (db) {
					db.get(pouchTransport.utils.keyFromHash(options.data.target)).then(function(target) {
						// TODO - normalise to function utils.saveRecord for setting defaults in one place
						target.name=options.data.name;
						target.ts=Date.now();
						if (target.type=='file') target.mime=MimeConverter.lookupMime(target.name);
						else target.mime='directory';
						console.log('new target ',target);
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
										//console.log('RM have kids d');
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
						console.log('RM FINALLY');
						d.resolve({removed:options.data.targets}); 
					}
				);
			}
			break;
		case 'search' :
			var promises=[];
			//console.log('SEASRCH',pouchTransport.options.dbs,options.data);
			$.each(pouchTransport.options.dbs,function(key,dbConfig) {
				if (dbConfig.searchable!==false) {
					//console.log('SEARCHABLE',dbConfig);
					var dfr=$.Deferred();
					promises.push(dfr);
					var db=pouchTransport.utils.getDatabase(dbConfig.name+'_anyoldid');
					if (db && options.data.q) {
						var qParts=options.data.q.split(' ');
						q=qParts[0];
						//console.log('seasrch',q);
						db.query(
							function(d) {
								function grep(ary,filt) {
									var result=[];
									for(var i=0,len=ary.length;i++<len;) {
										var member=ary[i]||'';
										if(filt && (typeof filt === 'Function') ? filt(member) : member) {
											result.push(member);
										}
									}
									return result;
								}
								if (d.type=='file' || d.type=='directory') {
									var punct='\\['+ '\\!'+ '\\"'+ '\\#'+ '\\$'+   // since javascript does not
									'\\%'+ '\\&'+ '\\\''+ '\\('+ '\\)'+  // support POSIX character
									'\\*'+ '\\+'+ '\\,'+ '\\\\'+ '\\-'+  // classes, we'll need our
									'\\.'+ '\\/'+ '\\:'+ '\\;'+ '\\<'+   // own version of [:punct:]
									'\\='+ '\\>'+ '\\?'+ '\\@'+ '\\['+
									'\\]'+ '\\^'+ '\\_'+ '\\`'+ '\\{'+
									'\\|'+ '\\}'+ '\\~'+ '\\]';

									
									var re=new RegExp(     // tokenizer
									'\\s*'+            // discard possible leading whitespace
									'('+               // start capture group
									'\\.{3}'+            // ellipsis (must appear before punct)
									'|'+               // alternator
									//'\\w+\\-\\w+'+       // hyphenated words (must appear before punct)
									//'|'+               // alternator
									//'\\w+\'(?:\\w+)?'+   // compound words (must appear before punct)
									//'|'+               // alternator
									//'\\w+'+              // other words
									//'|'+               // alternator
									'['+punct+']'+        // punct
									')'                // end capture group
									);
									emit(d.name,d);
									
									var tokens=grep( d.name.split(re) );
									for (var i=0; i < tokens.length; i++) {
										emit(tokens[i],d);
									};
									
									
								}
							},
							{startkey:q ,endkey:q+"\ufff0"},
							function(err,response) {
								//console.log('QP',qParts);
								var searchResults=[];
								if (!pouchTransport.utils.onerror(err)) {
									//console.log('Done',response);
									var searchResultHash={};
									$.each(response.rows,function(key,val) {
										searchResultHash[val.value.hash]=val.value;
									});
									$.each(searchResultHash,function(key,val) {
										var OK=true;
										// extra filter parts
										if (qParts.length>1) {
											for (var i=1; i<qParts.length; i++) {
												if (val.name.indexOf(qParts[i])==-1) {
													OK=false;
												}
											}
										}
										if (OK) searchResults.push(val);
									});
								}
								dfr.resolve(searchResults);
							}
						);
					}
				}
			});
			$.when.apply($,promises).then(function() {
				var final=[];
				$.each(arguments,function(key,results) {
					$.each(results,function(key,value) {
						final.push(value);
					});
				});
				//console.log('FINALLY',final);
				var ret={files:final}; 
				d.resolve(ret);
			});

			break;
		case 'get' :
			pouchTransport.utils.getAttachment(options.data.target).then(function(bs) {
				if (bs) {
					var br=new FileReader();
					br.onload=function(data) {
						//console.log('GET',data.target.result);
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
