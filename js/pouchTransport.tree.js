if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.tree = {

	// ASYNC TREE TRAVERSAL METHODS

	// OK
	getRootsAndSubfolders : function() {
	//console.log('roots and subfolders');
		var mDfr=$.Deferred();
		var volumes=pouchTransport.tree.configuredRoots();
		var promises=[];
		$.each(volumes,function(key,value) {
			var db=pouchTransport.utils.getDatabase(value.hash);
			if (db) {
				//console.log('DD',value);
				var dfr=$.Deferred();
				db.query(
					function(doc) {
						if (doc.type=='directory'){
							emit(doc.phash,doc);
						}
					},
					{key:value.hash},
					function(err,response) {
						if (err) {
							console.log(err)
							//dfr.reject();
							dfr.resolve();
						} else if (response) {
						//	console.log('VOL Q',response);
							dfr.resolve(response.rows);
						}
					}
				);
				promises.push(dfr);
			}
		});
		$.when.apply($,promises).then(function() {
		//	console.log('all subfolders',arguments);
			var volumeChildren=[];
			$.each(arguments,function(key,value) {
				$.each(value,function(k,v) {
					if (v.value.type=='directory') v.value.dir=1;
					volumeChildren.push(v.value);
				});
			});
			//console.log('combo kids',volumeChildren);
			mDfr.resolve(volumes.concat(volumeChildren));
		});
		return mDfr;
	},
	//OK
	getChildren : function(target) {
		var targetId=pouchTransport.utils.keyFromHash(target);
		var volume=pouchTransport.utils.volumeFromHash(target);
		console.log('getChildren',targetId,target,volume);
		var db=pouchTransport.utils.getDatabase(target);
		var dfr=$.Deferred();
		if (db && targetId.length>0) {
			db.query(
				function(doc) {
					if (doc.type=='directory' ||  doc.type=='file') {
						emit(doc.phash,doc);
					}
				},
				//{key:target},
				function(err,response) {
					if (err) {
						console.log(err);
						dfr.reject();
					} else {
						//console.log('query children done',err,response,response.rows);
						var result=[];
						$.each(response.rows,function(k,v) {
							if (v.value.type=='directory') v.value.dir=1;
							result.push(v.value);
						});
						dfr.resolve(result);
					}
				}
			);
		} else {
			dfr.resolve([]);
		}
		return dfr;
	},
	getChildFolders : function(target) {
		var db=pouchTransport.utils.getDatabase(target);
		var targetId=pouchTransport.utils.keyFromHash(target);
		//console.log('getChildren',targetId,target);
		var dfr=$.Deferred();
		if (db && targetId.length>0) {
			db.query(
				function(doc) {
					if (doc.type=='directory') {
						emit(doc.phash,doc);
					}
				},
				{key:pouchTransport.utils.volumeFromHash(target)+'_'+targetId},
				function(err,response) {
					if (err) {
						console.log(err);
						dfr.reject();
					} else {
						//console.log('query children done',err,response,response.rows);
						var result=[];
						$.each(response.rows,function(k,v) {
							v.value.dir=1;
							result.push(v.value);
						});
						dfr.resolve(result);
					}
				}
			);
		} else {
			dfr.resolve([]);
		}
		return dfr;
	},
	getTree : function (target) {
		var targetId=pouchTransport.utils.keyFromHash(target);
		var db=pouchTransport.utils.getDatabase(target);
		//console.log('getTree',targetId,target);
		var dfr=$.Deferred();
		if (db && targetId.length>0) {
			db.query(
				function(doc) {
					if (doc.type=='directory' || doc.type=='file') {
						emit(doc.hash,doc);
						emit(doc.phash,doc);
					}
				},
				{key:pouchTransport.utils.volumeFromHash(target)+'_'+targetId},
				function(err,response) {
					if (err) {
						console.log(err);
						dfr.reject();
					} else {
						//console.log('query children done',err,response,response.rows);
						var result=[];
						$.each(response.rows,function(k,v) {
							v.value.dir=1;
							result.push(v.value);
						});
						dfr.resolve(result);
					}
				}
			);
		} else {
			dfr.resolve([]);
		}
		return dfr;
	},
	getParentsWithSiblings : function (target) {
		var targetId=pouchTransport.utils.keyFromHash(target);
		var db=pouchTransport.utils.getDatabase(target);
		var dfr=$.Deferred();
		pouchTransport.tree.getRootline(target).then(function(parents) {
			var promises=[];
			$.each(parents,function(k,parent) {
				var idfr=$.Deferred();
				promises.push(idfr);
				pouchTransport.tree.getChildFolders(parent.phash,true).then(function(children) {
					idfr.resolve(children);
				});
			});
			// now mash it all together
			$.when.apply($,promises).then(function(childrenArrays) {
				//console.log('CA',arguments)
				var parentHash={};
				$.each(parents,function(k,parent) {
					parentHash[parent.hash]=parent;
				});
				$.each(arguments,function(k,children) {
					$.each(children,function(ki,child) {
						if (!parentHash[child.hash]) parentHash[child.hash]=child;
					});
				});
				var all=[]
				$.each(parentHash,function(k,hash) {
					all.push(hash);
				});
				dfr.resolve(all);
			});
		});
		return dfr;
	},
	getAllFilesAndDirectoriesInside : function(targets) {
		console.log('looking for files inside',targets);
		var mdfr=$.Deferred();
		var promises=[];
		pouchTransport.tree.getTargets(targets).then(function(targetRecords) {
			var fileTargets=[];
			var folderTargets=[]
			$.each(targets,function(k,target) {
				if (target.type=='file' || target.type=='directory') fileTargets.push(target);
				else folderTargets.push(target);
			});
			$.each(folderTargets,function(key,hash) {
				var dfr=$.Deferred();
				promises.push(dfr);
				pouchTransport.tree.getAllChildren(hash).then(function(subChildren) {
					dfr.resolve(subChildren);
				});
			});
			$.when.apply($,promises).then(function() {
				final=[];
				$.each(arguments,function(key,subChildren) {
					$.each(subChildren,function (k,v) {
						console.log('looking for files',v.type,v);
						if (v.type=='file' || target.type=='directory') final.push(v);
					});
				});
				console.log('final children',final,fileTargets);
				$.each(fileTargets,function(k,v) {
					final.unshift(v);
				});
				//`fileTargets.concat(final);
				console.log('loaded targets resolve with ',final);
				mdfr.resolve(final);
			});
		});
		return mdfr;
	},
	getAllFilesInside : function(targets) {
		console.log('looking for files inside',targets);
		var mdfr=$.Deferred();
		var promises=[];
		pouchTransport.tree.getTargets(targets).then(function(targetRecords) {
			var fileTargets=[];
			var folderTargets=[]
			$.each(targets,function(k,target) {
				if (target.type=='file') fileTargets.push(target);
				else folderTargets.push(target);
			});
			$.each(folderTargets,function(key,hash) {
				var dfr=$.Deferred();
				promises.push(dfr);
				pouchTransport.tree.getAllChildren(hash).then(function(subChildren) {
					dfr.resolve(subChildren);
				});
			});
			$.when.apply($,promises).then(function() {
				final=[];
				$.each(arguments,function(key,subChildren) {
					$.each(subChildren,function (k,v) {
						console.log('looking for files',v.type,v);
						if (v.type=='file') final.push(v);
					});
				});
				console.log('final children',final,fileTargets);
				$.each(fileTargets,function(k,v) {
					final.unshift(v);
				});
				//`fileTargets.concat(final);
				console.log('loaded targets resolve with ',final);
				mdfr.resolve(final);
			});
		});
		return mdfr;
	},
	getAllChildren : function(target) {
		var db=pouchTransport.utils.getDatabase(target);
		var masterDfr=$.Deferred();
		
		var getAllChildrenRecursive = function(target) {
			console.log('get all children',target);
		
			var dfr=$.Deferred();
			if (db) {
				db.query(
					function(doc) {
						if (doc.type=='file' || doc.type== 'directory') {
							emit(doc.phash,doc);
						}
					},
					{key:target},
					function(err,response) {
						console.log('response',response);
						var promises=[];
						var all=[];
						$.each(response.rows,function(k,row) {
							promises.push(getAllChildrenRecursive(row.value.hash));
							all.push(row.value);
						});
						$.when.apply($,promises).then(function() {
							console.log('args',arguments);
							$.each(arguments,function(argument,items) {
								$.each(items,function(ik,item) {
									all.push(item);
								});
							});
							console.log('med res',all);
							dfr.resolve(all);
						});
					}
				);
			}
			return dfr;
		}
		$.when(getAllChildrenRecursive(target)).then(function() {
			var all=[];
			$.each(arguments,function(argument,items) {
				$.each(items,function(ik,item) {
					all.push(item);
				});
			});
			//console.log('finally',all);
			masterDfr.resolve(all);
		});		
		return masterDfr;
	},
	getRootline : function(target) {
		var db=pouchTransport.utils.getDatabase(target);
		var masterDfr=$.Deferred();
			
		if (db) {
			var targetId=pouchTransport.utils.keyFromHash(target);
			//console.log('get rootline',targetId);
			var getRootlineRecursive = function(targetId,rootLine) {
				var dfr=$.Deferred();
				//console.log('get rootline recursive',targetId,rootLine);
				if (typeof rootLine =='undefined') rootLine=[];
				// lookup targetId
				db.query(
					function(doc) {
						emit(doc._id,doc);
					},
					{key:targetId},
					function(err,response) {
						//console.log('query done',err,response);
						// if parent reference, recurse
						if (response.rows && response.rows[0]&& response.rows[0].value && response.rows[0].value.phash) {
							//console.log('have hash now',rootLine);
							$.when(getRootlineRecursive(pouchTransport.utils.keyFromHash(response.rows[0].value.phash),rootLine)).then(function(iRootLine) {
								response.rows[0].value.dirs=1;
								iRootLine.push(response.rows[0].value);
								//console.log('coming back up',iRootLine);
								dfr.resolve(iRootLine);
							});
						} else {
							if (response.rows && response.rows[0]&& response.rows[0].value) {
								response.rows[0].value.dirs=1;
								rootLine.push(response.rows[0].value);
							}
							dfr.resolve(rootLine);
						}
					}
				);
				return dfr;
			}
			
			if (targetId) {
				$.when(getRootlineRecursive(targetId)).then(function(rootLine) {
					//console.log('got rootline recursive',targetId,rootLine);
					masterDfr.resolve(rootLine);
				});
			}
		}
		return masterDfr;
	},
	getTarget : function(target) {
		var db=pouchTransport.utils.getDatabase(target);
		//console.log('getTarget',targetId);
		var dfr=$.Deferred();
		if (db && target.length>0) {
			db.query(
				function(doc) {
					if (doc.type=='directory' || doc.type=='file') {
						emit(doc.hash,doc);
					}
				},
				{key:target},
				function(err,response) {
					if (err) {
						console.log(err);
						dfr.reject();
					} else {
						//console.log('query target done',err,response,response.rows);
						var result=[];
						$.each(response.rows,function(k,v) {
							result.push(v.value);
						});
						dfr.resolve(result);
					}
				}
			);
		} else {
			dfr.resolve([]);
		}
		return dfr;
	},
	getTargets : function(targets) {
		// assume all targets in same filesystem
		var dfr=$.Deferred();
		var db=pouchTransport.utils.getDatabase(targets[0]);
		if (db) {
			//console.log('getTarget',targetId);
			if (db && targets.length>0) {
				db.query(
					function(doc) {
						if (doc.type=='directory' || doc.type=='file') {
							emit(doc.hash,doc);
						}
					},
					{keys:targets},
					function(err,response) {
						if (err) {
							console.log(err);
							dfr.reject();
						} else {
							//console.log('query target done',err,response,response.rows);
							var result=[];
							$.each(response.rows,function(k,v) {
								result.push(v.value);
							});
							dfr.resolve(result);
						}
					}
				);
			} else {
				dfr.resolve([]);
			}
		}
		return dfr;
	},
	configuredRoots:function () {
		// pretend folders
		// map as filesystem with fake ids for rendering with locked=true and phash=""
		var config=pouchTransport.options;
		var roots=[];
		$.each(config.dbs,function(key,rootConfig) {
			roots.push({
				_id: 'filesystemroot',
				name: rootConfig.description,
				hash : rootConfig.name+'_filesystemroot',
				volumeid : rootConfig.name,
				locked : 0,mime : 'directory' ,type : 'directory',dirs:1,read : 1,locked:1, write:1,size :0,ts:Date.now()
			});
		});
		//console.log('configured roots',roots);
		return roots;
	},
	mashResults : function(items) {
		var itemHash={};
		$.each(items,function(k,child) {
			if (child.type=='directory') child.dirs=1;
			if (!itemHash[child.hash]) itemHash[child.hash]=child;
		});
		var all=[]
		$.each(itemHash,function(k,hash) {
			all.push(hash);
		});
		return all;
	} 
}