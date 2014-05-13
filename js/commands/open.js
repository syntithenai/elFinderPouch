"use strict"
/**
 * @class  elFinder command "open"
 * Enter folder or open files in new windows
 *
 * @author Dmitry (dio) Levashov
 **/  
elFinder.prototype.commands.open = function() {
	this.alwaysEnabled = true;
	
	this._handlers = {
		dblclick : function(e) { e.preventDefault(); this.exec() },
		'select enable disable reload' : function(e) { this.update(e.type == 'disable' ? -1 : void(0));  }
	}
	
	this.shortcuts = [{
		pattern     : 'ctrl+down numpad_enter'+(this.fm.OS != 'mac' && ' enter')
	}];

	this.getstate = function(sel) {
		var sel = this.files(sel),
			cnt = sel.length;
		
		return cnt == 1 
			? 0 
			: cnt ? ($.map(sel, function(file) { return file.mime == 'directory' ? null : file}).length == cnt ? 0 : -1) : -1
	}
	
	this.exec = function(hashes) {
		var fm    = this.fm, 
			dfrd  = $.Deferred().fail(function(error) { error && fm.error(error); }),
			files = this.files(hashes),
			cnt   = files.length,
			file, url, s, w;

		if (!cnt) {
			return dfrd.reject();
		}

		// open folder
		if (cnt == 1 && (file = files[0]) && file.mime == 'directory') {
			return file && !file.read
				? dfrd.reject(['errOpen', file.name, 'errPerm'])
				: fm.request({
						data   : {cmd  : 'open', target : file.thash || file.hash},
						notify : {type : 'open', cnt : 1, hideCnt : true},
						syncOnFail : true
					});
		}
		
		files = $.map(files, function(file) { return file.mime != 'directory' ? file : null });
		
		// nothing to open or files and folders selected - do nothing
		if (cnt != files.length) {
			return dfrd.reject();
		}
		
		var openWindow=function(file,bs,dfrd) {
			// set window size for image if set
			if (file.dim) {
				s = file.dim.split('x');
				w = 'width='+(parseInt(s[0])+20) + ',height='+(parseInt(s[1])+20);
			} else {
				w = 'width='+parseInt(9*$(window).width()/10)+',height='+parseInt(9*$(window).height()/10);
			}
			//console.log('B64',bs.substr(0,100))
			var wnd = window.open(bs, 'new_window', w + ',top=50,left=50,scrollbars=yes,resizable=yes');
			if (!wnd) {
				return dfrd.reject('errPopup');
			} else {
				
			}
		}
		
		// open files
		cnt = files.length;
		var editableFiles=[];
		while (cnt--) {
			file = files[cnt];
			if (!file.read) {
				return dfrd.reject(['errOpen', file.name, 'errPerm']);
			}
			var mimeParts=file.mime.split("/");
			if (mimeParts[0]=="text" || file.mime=="image/svg+xml"|| file.mime=="application/json") {
				// redirect to edit
				//console.log('what now, direct edit',this.fm,fm);
				this.fm.exec('edit',[file.hash],{}).then(function(res) {
					//console.log('get done',res,arguments);
				});
				/*fm.request({
					data   : {cmd  : 'get', target :  file.hash},
					notify : {type : 'open', cnt : 1, hideCnt : true},
					syncOnFail : true
				});*/
			} else {
				var	createReader = function(file, content) {
					var dfrd = $.Deferred(),
					ta   = $('<div class="elfinder-epub"  id="'+file.id+'-epub"></div>'),
					cancel = function() {
						console.log('close READER cancel');
						ta.elfinderdialog('close');
						ta.remove();
						dfrd.reject();
					},opts = {
						title   : file.name,
						width   :  $(window).width()*0.97,
						height   :  $(window).height()*0.97,
						buttons : {},
						close   : function() { 
							console.log('close READER');
							$(this).elfinderdialog('destroy'); 
							ta.remove();
							//ta.editor && ta.editor.close(ta[0], ta.editor.instance);
							
						},
						open    : function() { 
							//fm.disable();
							pouchTransportConfig.readers.createReader(content,ta);
						}
						
					};	
					opts.buttons[fm.i18n('Close')] = cancel;					
					fm.dialog(ta, opts).attr('id', file.id);
					
					//return dfrd.resolve();
				};		
				// always want blob for epub
				if (pouchTransport.utils.isLocalPouch(file.hash) || file.mime=='application/epub+zip')  {
					pouchTransport.utils.getAttachment(file.hash).then(function(bs) {
						if (bs) {
							var mimeParts=file.mime.split("/");
							// SPECIAL CASES  FOR OPENING FOR CERTAIN MIME TYPES
							if (file.mime=='application/epub+zip') {
								var bs = new Blob([bs],{type: file.mime});
								createReader(file,bs);
							} else {
								bs = new Blob([bs],{type: file.mime});
								openWindow(file,URL.createObjectURL(bs),dfrd);
							}
						}
						//console.log('loaded attachment',file.name,file.hash);
					});
				} else if (pouchTransport.utils.isCouch(file.hash)) {
					//console.log('HAVE COUCH return url');
					var srcParts=[pouchTransport.utils.getDatabaseConfig(file.hash).connectionString];
					srcParts.push(file._id);
					srcParts.push('fileContent');
					window.open(srcParts.join("/"));
				} else {
					if (!(url = fm.url(/*file.thash || */file.hash))) {
						url = fm.options.url;
						url = url + (url.indexOf('?') === -1 ? '?' : '&')
							+ (fm.oldAPI ? 'cmd=open&current='+file.phash : 'cmd=file')
							+ '&target=' + file.hash;
					}
				
					// set window size for image if set
					if (file.dim) {
						s = file.dim.split('x');
						w = 'width='+(parseInt(s[0])+20) + ',height='+(parseInt(s[1])+20);
					} else {
						w = 'width='+parseInt(2*$(window).width()/3)+',height='+parseInt(2*$(window).height()/3);
					}

					var wnd = window.open('', 'new_window', w + ',top=50,left=50,scrollbars=yes,resizable=yes');
					if (!wnd) {
						return dfrd.reject('errPopup');
					}
					
					var form = document.createElement("form");
					form.action = fm.options.url;
					form.method = 'POST';
					form.target = 'new_window';
					form.style.display = 'none';
					var params = $.extend({}, fm.options.customData, {
						cmd: 'file',
						target: file.hash
					});
					$.each(params, function(key, val)
					{
						var input = document.createElement("input");
						input.name = key;
						input.value = val;
						form.appendChild(input);
					});
					
					document.body.appendChild(form);
					form.submit();
				}
			}
		}
		return dfrd.resolve(hashes);
	}

}