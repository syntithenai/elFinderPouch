if (pouchTransport=='undefined') pouchTransport={};
pouchTransport.upload = function(a,fm) {
	var e=a.event;
	//var directoryHash={};
	//console.log('upload files',a,e);
	function traverseFileTree(item, path,phash) {
		var dfr=$.Deferred();
		path = path || "";
		//console.log('traverse',item,path);
		if (item.isDirectory) {
			//console.log('dir ',item);
			// create new directory
			if (!phash) {
				phash=fm.cwd().hash;
			}
			var toAdd={
				name: item.name,
				phash : phash,
				locked : 0,
				mime : 'directory',
				type : 'directory',
				read : 1,
				write:1,
				size :0,
				ts:Date.now()
			};
			var db=pouchTransport.utils.getDatabase(phash);
			db.post(toAdd,function(err,postResponse) {
				toAdd._id=postResponse.id;
				toAdd._rev=postResponse.rev;
				toAdd.hash=pouchTransport.utils.volumeFromHash(phash)+'_'+toAdd._id;
				db.put(toAdd,function(err,putResponse) {
					//directoryHash[path]=toAdd.hash;
					//console.log('dlookup set',directoryHash);
					// Get folder contents
					var dirReader = item.createReader();
					dirReader.readEntries(function(entries) {
						var subPromises=[];
						for (var i=0; i<entries.length; i++) {
							var entry=entries[i];
							subPromises.push(traverseFileTree(entry, path + item.name + "/",toAdd.hash));
						}
						// wait for sub dirs
						$.when.apply($,subPromises).then(function() {
							var final=[];
							$.each(Array.prototype.slice.call(arguments, 0),function(k,arg) {
								$.each(arg,function(k,v) { final.push(v); });
							});
							final.unshift(toAdd);
							//console.log('resolve.subpromises dir',final);
							dfr.resolve(final);
						});
					});
					
				});
			});
			
			
		} else if (item.isFile) {
			// Get file
			item.file(function(file) {
				//console.log("File: " + path + file.name,file);
				 var reader = new FileReader();
				// Closure to capture the file information.
				reader.onload = (function(fileRef) {
					return function(e) {
						//console.log('contents loaded',fileRef,item)
						//console.log('PATH',path,fm.cwd()); //e.target.result.substr(0,15),item);
						// NOW SAVE A NEW FILE RECORD
						if (!phash) {
							phash=fm.cwd().hash;
						}
						var db=pouchTransport.utils.getDatabase(phash);
						var toAdd={
							name: fileRef.name,
							phash : phash,
							size : fileRef.size,
							locked : 0,mime : fileRef.type ,type : 'file',read : 1,write:1,size :0,ts:Date.now()
						};
						// TODO check for name conflict and rename if required
						db.post(toAdd,function(err,postResponse) {
							toAdd._id=postResponse.id;
							toAdd._rev=postResponse.rev;
							toAdd.hash=pouchTransport.utils.volumeFromHash(phash)+'_'+toAdd._id;
							db.put(toAdd,function(err,putResponse) {
								//console.log('responses',postResponse,putResponse);
								if (err) {
									console.log('ERROR',err);
								} else {
									db.putAttachment(toAdd._id,'fileContent',putResponse.rev,new Blob([reader.result]),'',function(err,attResponse) {
										if (err) {
											console.log('ERROR',err);
										} else {											
											var cwd={hash:fm.cwd().hash};
											//if (options.data.cmd=='mkfile') cwd={hash:toAdd.phash};
											var ret={cwd:cwd,added:[toAdd]};
											//console.log('f',ret);
											dfr.resolve(ret);
										}
									});
									//console.log('resolve subpromise file',toAdd);
									dfr.resolve([toAdd]);
								}
							});
						});
					}
				})(file);
				var mimeParts=file.type.split("/");
				if (mimeParts[0]=='image') {
					reader.readAsDataURL(file);
				} else {
					reader.readAsText(file);
				}
			})
		}
		return dfr;
	}
	
	
	
	//console.log('upload',e.target,e.dataTransfer);
	//var dfr=$.Deferred();
	var promises=[];
	var d=new $.Deferred();
	
	//var masterDfr=$.Deferred();
	var entries;
	//console.log('start',e)
	// DND   yay dataTransfer
	if (e.dataTransfer && e.dataTransfer.items) {
		entries = e.dataTransfer.items;
		for (var i = 0, f; f = entries[i]; i++) {
			promises.push(traverseFileTree(entries[i].webkitGetAsEntry()));
		}
		// wait for uploads per item (recursively(
		$.when.apply($,promises).then(function(res) {
			//console.log('resolve.master args',arguments);
			var final=[];
			$.each(Array.prototype.slice.call(arguments, 0),function(k,arg) {
				final.push(arg);
			});
			var cwd={hash:fm.cwd().hash};
			//if (options.data.cmd=='mkfile') cwd={hash:toAdd.phash};
			var ret={cwd:cwd,added:final[0]};
			//console.log('resolve.master',ret);
			//masterDfr.resolve(ret);
			d.resolve(ret);
			fm.request({
				data   : {cmd  : 'open', target : fm.cwd().hash},
				notify : {type : 'open', cnt : 1, hideCnt : true},
				syncOnFail : true
			});
			
		});
	// list of files from std file input - Files rather than Items
	// input type=file with or without webkitdirectory for folder selection				
	} else if (e.target && e.target.files) {
		entries = e.target.files;
		//console.log('input upload',entries);
		// collate folders
		var folders={};
		var columns={};
		var maxParts=0;
		$.each(entries,function(key,entry) {
			var parts=entry.webkitRelativePath.split('/');
			if (parts.length>1) {
				var name=parts[parts.length-1];
				parts=parts.slice(0,parts.length-1);
				if (parts.length>maxParts) maxParts=parts.length;
				// collate folders
				for (i=0; i<parts.length; i++) {
					var ikey=[parts[i]];
					if (i>0) {
						for (j=i-1; j>=0 ;j--) {
							ikey.unshift(parts[j]);
						}
					}
					folders[parts.join("/")]={name:parts[parts.length-1],parent:parts.slice(0,parts.length-1).join("/"),locked : 0,mime : 'directory',type : 'directory',read : 1,write:1,size :0,ts:Date.now()};
				}
			}
		});
		//console.log('collated folders',folders);
		// create them all and get ids table
		$.when.apply($,function() {
			var promises=[];
			$.each(folders,function(folderPath,folder) {
				// save folder
				var dfr=$.Deferred();
				db.post(folder,function(err,response) {
					//console.log('response',response,folder);
					var ret=[folderPath,folder,response];
					dfr.resolve(ret);
				});
				promises.push(dfr);
			});
			return promises;
		// then update them all 
		}()).then(function() {
			//console.log('created folders',folders,arguments);
			var promises=[];
			$.each(arguments,function(k,folderDetails) {
				var dfr=$.Deferred();
				//console.log(folderDetails);
				folderPath=folderDetails[0];
				folderItem=folderDetails[1];
				folderResponse=folderDetails[2];
				folderItem._id=folderResponse.id;
				folderItem._rev=folderResponse.rev;
				folderItem.hash=pouchTransport.utils.volumeFromHash(folders[folderItem.parent].hash)+'_'+folderResponse.id;
				if ($.trim(folderItem.parent).length>0) folderItem.phash=pouchTransport.utils.volumeFromHash(folders[folderItem.parent].hash)+'_'+folders[folderItem.parent]._id;
				else folderItem.phash=fm.cwd().hash;
				delete folderItem.parent;
				//console.log('AAA',folderItem); //,folderItem.parent,folders);
				db.put(folderItem,function(err,response) {
					dfr.resolve(folderItem);
				});
				promises.push(dfr);
			});
			$.when.apply($,promises).then(function() {
				//console.log('now I can create the files',entries,arguments);
				$.each(entries,function(key,file) {
					var parts=file.webkitRelativePath.split("/");
					if (parts[parts.length-1] !='.' ) {
						var path=parts.slice(0,parts.length-1).join("/");
						var phash=fm.cwd().hash;
						if (folders[parts.slice(0,parts.length-1).join("/")]) phash=pouchTransport.utils.volumeFromHash(folders[folderItem.parent].hash)+'-'+folders[parts.slice(0,parts.length-1).join("/")]._id;
						var reader = new FileReader();
						reader.onload = (function(fileRef) {
							return function(e) {
								var newFile={name:parts[parts.length-1],phash:phash,locked : 0,mime : file.type,type : 'file',read : 1,write:1,ts:Date.now(),size : file.size};
								db.post(newFile,function(err,response) {
									newFile._id=response.id;
									newFile.hash=pouchTransport.utils.volumeFromHash(newFile.phash)+'_'+response.id;
									newFile._rev=response.rev;
									db.put(newFile,function(err,putResponse) {
										// now put file content
										console.log('donw put',err,putResponse,newFile);
										if (err) {
											console.log('ERROR',err);
										} else {
											db.putAttachment(newFile._id,'fileContent',putResponse.rev,new Blob([reader.result]),'',function(err,attResponse) {
												//console.log('resolve subpromise file',newFile);
												fm.request({
													data   : {cmd  : 'open', target : fm.cwd().hash},
													notify : {type : 'open', cnt : 1, hideCnt : true},
													syncOnFail : true
												});
											});
										}
									});
								});
							}
						})(file);
						var mimeParts=file.type.split("/");
						if (mimeParts[0]=='image') {
							reader.readAsDataURL(file);
						} else {
							reader.readAsText(file);
						}
					}
				});
			});
			
		});

	}
	
	return d;
}
					
