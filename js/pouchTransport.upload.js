/*********************************************************************
 The upload method needs to deal with a few cases with data coming to us in different formats
 1. dragged and dropped files in which case we have access to DataTransfer 
 In this case we call traverseFileTree and import into the database at each step in the traversal
 as well as return a complete list of files and directories objects suitable for elfinder
 
 2. file upload element or file upload with folderupload enabled in which case we get
 file references. In case of a folder selection, each file reference has a webkitPath that we can use to create create folder records as needed.
 This approach requires mapping the folder parents.
 *********************************************************************/

pouchTransport.upload = function(a,fm) {
	var e=a.event;
	//var directoryHash={};
	console.log('upload files',a,e);

	/*******************************************************
	 * Process upload for <input type=file>
	 * Process a list of files and create file and directory records 
	 derived from the webkitRelativePath of each file
	 *******************************************************/
	function createFileTree(entries) {
		var mdfr=$.Deferred();
		console.log('input upload',entries);
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
			$.each(arguments,function(folderPath,folder) {
				// save folder
				var dfr=$.Deferred();
				//console.log('dbget',folderPath,folder);
				var db=pouchTransport.utils.getDatabase(folder.hash);
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
			console.log('created folders now update with phash',folders,arguments);
			var promises=[];
			$.each(arguments,function(k,folderDetails) {
				var dfr=$.Deferred();
				console.log(folderDetails);
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
				var db=pouchTransport.utils.getDatabase(folderItem.hash);
				db.put(folderItem,function(err,response) {
					dfr.resolve(folderItem);
				});
				promises.push(dfr);
			});
			$.when.apply($,promises).then(function() {
				console.log('now I can create the files',entries,arguments);
				var epromises=[];
				$.each(entries,function(key,file) {
					var edfr=$.Deferred();
					epromises.push(edfr);
					var parts;
					if (file.webkitRelativePath) parts=file.webkitRelativePath.split("/");
					else parts=[];
					if (parts[parts.length-1] !='.' ) {
						var path=parts.slice(0,parts.length-1).join("/");
						var phash=fm.cwd().hash;
						console.log(path,folders);
						// assign phash based on parent lookup in folders
						
						if (folders[path] && folders[path].parent && folders[folders[path].parent] && folders[folders[path].parent].hash && folders[path]._id) {
							phash=pouchTransport.utils.volumeFromHash(folders[folders[path].parent].hash)+'_'+folders[path]._id;
						}
						//console.log('PHAHS',phash)
						var reader = new FileReader();
						reader.onload = (function(fileRef) {
							//console.log('FHAHS',fileRef);
							//return function(e) {
								var newFile={name:fileRef.name,phash:phash,locked : 0,mime : MimeConverter.lookupMime(fileRef.name),type : 'file',read : 1,write:1,ts:Date.now(),size : file.size};
								if (pouchTransport.utils.isLocalPouch(phash) && fileRef.size>30241968) {
									alert('File '+fileRef.name+' is too large for a local pouch database');
									dfr.reject('File Too big');
								} else {
									var db=pouchTransport.utils.getDatabase(phash);
									db.post(newFile,function(err,response) {
										newFile._id=response.id;
										newFile.hash=pouchTransport.utils.volumeFromHash(newFile.phash)+'_'+response.id;
										newFile._rev=response.rev;
										newFile.type='file';
										db.put(newFile,function(err,putResponse) {
											// now put file content
											console.log('donw put',err,putResponse,newFile);
											if (err) {
												console.log('ERROR',err);
												edfr.reject(err);
											} else {
												db.putAttachment(newFile._id,'fileContent',putResponse.rev,new Blob([reader.result]),newFile.mime,function(err,attResponse) {
													edfr.resolve(newFile);
													console.log('resolve subpromise file',newFile);
												});
											}
										});
									});
								}
							// }
						})(file);
						reader.readAsArrayBuffer(file);
					}
				});
				$.when.apply($,epromises).then(function() {
					console.log('ALLD DONE');
					mdfr.resolve(arguments);
					fm.request({
						data   : {cmd  : 'open', target : fm.cwd().hash},
						notify : {type : 'open', cnt : 1, hideCnt : true},
						syncOnFail : true
					});

				});
			});
			
		});
		return mdfr;
	}
	
	/*******************************************************
	 * Process upload for Drag and Drop
	 * Process a File/Directory object and iterate recursively
	 * creating and saving a list of database files and directories 
	 * and returning a flat list of folders/files in iteration order
	 *******************************************************/
	
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
				console.log("File: " + path + file.name,file);
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
							locked : 0,mime : MimeConverter.lookupMime(fileRef.name) ,type : 'file',read : 1,write:1,ts:Date.now()
						};
						// around 30M seems fine
						if (pouchTransport.utils.isLocalPouch(phash) && fileRef.size>30241968) {
							alert('File '+fileRef.name+' is too large for a local pouch database');
							dfr.reject('File Too big');
						} else {
							// TODO check for name conflict and rename if required
							console.log('SAVE FILE to db',toAdd);
							db.post(toAdd,function(err,postResponse) {
								if (err) {
									console.log("ERROR",err);
								} else {
									toAdd._id=postResponse.id;
									toAdd._rev=postResponse.rev;
									toAdd.hash=pouchTransport.utils.volumeFromHash(toAdd.phash)+'_'+postResponse.id;
									console.log('update with id',toAdd,postResponse);
									db.put(toAdd,postResponse.revision,function(err,putResponse) {
										console.log('SAVED FILE responses',postResponse,putResponse,arguments);
										if (err) {
											console.log('ERROR',err);
										} else {
											console.log(reader.result)
											db.putAttachment(toAdd._id,'fileContent',putResponse.rev,new Blob([reader.result]),toAdd.mime,function(err,attResponse) {
												if (err) { 
													console.log('ERROR',err);
												} else {											
													var cwd={hash:fm.cwd().hash};
													//if (options.data.cmd=='mkfile') cwd={hash:toAdd.phash};
													var ret={cwd:cwd,added:[toAdd]};
													console.log('f',ret,reader.result,attResponse);
													dfr.resolve(ret);
												}
											});
											console.log('resolve subpromise file',toAdd);
											dfr.resolve([toAdd]);
										}
									});
								}
							});
						}
					}
				})(file);
				reader.readAsArrayBuffer(file);
			})
		}
		return dfr;
	}
	
	/**************************************************
	 * MAIN SWItCH
	 *************************************************/
	
	//console.log('upload',e.target,e.dataTransfer);
	//var dfr=$.Deferred();
	var promises=[];
	var d=new $.Deferred();
	
	//var masterDfr=$.Deferred();
	var entries;
	// DND   yay dataTransfer
	if (e.dataTransfer && e.dataTransfer.items) {
		console.log('start DND',e.dataTransfer)
		entries = e.dataTransfer.items;
		for (var i = 0, f; f = entries[i]; i++) {
			promises.push(traverseFileTree(entries[i].webkitGetAsEntry()));
		}
		// wait for uploads per item (recursively(
		$.when.apply($,promises).then(function(res) {
			console.log('resolve.master args',arguments);
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
		createFileTree(entries);
	}
	
	return d;
}
					
