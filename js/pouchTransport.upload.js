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
	//console.log('upload files',a,e);

	/*******************************************************
	 * Process upload for <input type=file>
	 * Process a list of files and create file and directory records 
	 derived from the webkitRelativePath of each file
	 *******************************************************/
	function createFileTree(entries,phash) {
		var mdfr=$.Deferred();
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
					if ($.trim(folders[parts.join("/")].parent)=="") {
						folders[parts.join("/")].phash=phash;
					}
				}
			}
		});
		//console.log('collated folders',folders);
		// create them all and get ids table
		var doPostFolders=function(folders) {
			var promises=[];
			$.each(folders,function(folderPath,folder) {
				// save folder
				var dfr=$.Deferred();
				//console.log('dbget',folderPath,folder);
				var db=pouchTransport.utils.getDatabase(phash);
				db.post(folder,function(err,response) {
					//console.log('response to create folder',response,folder);
					var ret=[folderPath,folder,response];
					dfr.resolve(ret);
				});
				promises.push(dfr);
			});
			return promises;
		// then update them all 
		};
		var mp=doPostFolders(folders);
		$.when.apply($,mp).then(function() {
			//console.log('created folders now update with phash',arguments);
			var promises=[];
			$.each(arguments,function(k,folderDetails) {
				var dfr=$.Deferred();
				//console.log("FD",k,folderDetails);
				folderPath=folderDetails[0];
				folderItem=folderDetails[1];
				folderResponse=folderDetails[2];
				folderItem._id=folderResponse.id;
				folderItem._rev=folderResponse.rev;
				folderItem.hash=pouchTransport.utils.volumeFromHash(phash)+'_'+folderResponse.id;
				//console.log('PRE SET PHASH',folderPath,folderItem,folderResponse);
				if ($.trim(folderItem.parent).length>0) folderItem.phash=pouchTransport.utils.volumeFromHash(phash)+'_'+folders[folderItem.parent]._id;
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
				//console.log('now I can create the files',entries,arguments);
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
						//console.log('SAVE FILE',parts,folders);
						// assign phash based on parent lookup in folders
						
						if (folders[path] && folders[path]._id) {
							phash=pouchTransport.utils.volumeFromHash(phash)+'_'+folders[path]._id;
						}
						var reader = new FileReader();
						// Closure to capture the file information.
						reader.onload = (function(fileRef) {
						//console.log('LOADEDA ',reader.result);
						return function(e) {
							//console.log('LOADED',e,fileRef);
							//console.log('file content',content);
							var b=new Blob([e.target.result],{type : MimeConverter.lookupMime(fileRef.name)});
						
							//var base64=Base64.encode(content);
							var newFile={
								name: fileRef.name,
								phash : phash,
								size : fileRef.size,
								locked : 0,mime : MimeConverter.lookupMime(fileRef.name) ,type : 'file',read : 1,write:1,ts:Date.now(),
							};
							if (pouchTransport.utils.isLocalPouch(phash) && fileRef.size>30241968) {
								alert('File '+fileRef.name+' is too large for a local pouch database');
								edfr.reject('File Too big');
							} else {
								var db=pouchTransport.utils.getDatabase(phash);
								//console.log('SAVE FILE to db',newFile);
								pouchTransport.utils.save(newFile,b).then(function(added) {
									var cwd={hash:fm.cwd().hash};
									var ret={cwd:cwd,added:[added]};
									//console.log('f',ret,reader.result,attResponse);
									edfr.resolve(ret);
								});
							}
						};
						})(file);

						// Read in the image file as a data URL for sending inline
						reader.readAsArrayBuffer(file);
					}
				});
				$.when.apply($,epromises).then(function() {
					//console.log('ALLD DONE');
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
				reader.onload = (function(theFile) {
					return function(e) {
						// Render thumbnail.
						//console.log(e.target.result,theFile)
						var b=new Blob([e.target.result],{type : MimeConverter.lookupMime(theFile.name)});
						//console.log(b);
						var newFile={
							name: theFile.name,
							phash : phash,
							size : theFile.size,
							locked : 0,mime : MimeConverter.lookupMime(theFile.name) ,type : 'file',read : 1,write:1,ts:Date.now(),
						};
						if (pouchTransport.utils.isLocalPouch(phash) && theFile.size>30241968) {
							alert('File '+theFile.name+' is too large for a local pouch database');
							dfr.reject('File Too big');
						} else {
							var db=pouchTransport.utils.getDatabase(phash);
							//console.log('SAVE FILE to db',newFile);
							pouchTransport.utils.save(newFile,b).then(function(added) {
								var cwd={hash:fm.cwd().hash};
								var ret={cwd:cwd,added:[added]};
								//console.log('f',ret);
								dfr.resolve(ret);
							});
						}
					};
				})(file);

				// Read in the image file as a data URL.
				reader.readAsArrayBuffer(file);




/*
			var reader = new FileReader();
				// Closure to capture the file information.
				reader.onload = (function(fileRef) {
					//console.log('loaded',fileRef,arguments,this,this.target.result,window.URL.createObjectURL(new Blob([this.target.result])));
					var content=new Blob([reader.result],{type : MimeConverter.lookupMime(fileRef.name)});
					console.log('LOADED',content);
					return function(e) {
						//var content=this.target.result;
						console.log('LOADED still',content);
						var newFile={
							name: fileRef.name,
							phash : phash,
							size : fileRef.size,
							locked : 0,mime : MimeConverter.lookupMime(fileRef.name) ,type : 'file',read : 1,write:1,ts:Date.now(),
						};
						if (pouchTransport.utils.isLocalPouch(phash) && fileRef.size>30241968) {
							alert('File '+fileRef.name+' is too large for a local pouch database');
							dfr.reject('File Too big');
						} else {
							var db=pouchTransport.utils.getDatabase(phash);
							//console.log('SAVE FILE to db',newFile);
							pouchTransport.utils.save(newFile,content).then(function(added) {
								var cwd={hash:fm.cwd().hash};
								var ret={cwd:cwd,added:[added]};
								//console.log('f',ret);
								dfr.resolve(ret);
							});
						}
					}(file);
				});

				// Read in the image file as a data URL for sending inline
				reader.readAsArrayBuffer(file);*/
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
	//console.log('UPLOAD MAINSWITCH',a,e);
	// DND   yay dataTransfer
	if (e && e.dataTransfer && e.dataTransfer.items) {
		//console.log('start DND',e.dataTransfer)
		entries = e.dataTransfer.items;
		for (var i = 0, f; f = entries[i]; i++) {
			promises.push(traverseFileTree(entries[i].webkitGetAsEntry(),'',fm.cwd().hash));
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
	} else if (e && e.target && e.target.files) {
		entries = e.target.files;
		createFileTree(entries,fm.cwd().hash);
	} else if (a.input && a.input.files) {
		entries = a.input.files;
		createFileTree(entries,fm.cwd().hash);
	}
	
	return d;
}
					
