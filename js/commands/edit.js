"use strict"
/**
 * @class elFinder command "edit". 
 * Edit text file in dialog window
 *
 * @author Dmitry (dio) Levashov, dio@std42.ru
 **/
elFinder.prototype.commands.edit = function() {
	var self  = this,
		fm    = this.fm,
		mimes = fm.res('mimes', 'text') || [],
		
		/**
		 * Return files acceptable to edit
		 *
		 * @param  Array  files hashes
		 * @return Array
		 **/
		filter = function(files) {
			return $.map(files, function(file) {
				//return file;
				return (file.mime.indexOf('text/') === 0 || 
					file.mime.indexOf('application/json') === 0||
					file.mime.indexOf('image/svg+xml') === 0|| file.mime.indexOf('image/jpeg') === 0|| 
					file.mime.indexOf('image/gif') === 0|| file.mime.indexOf('image/png') === 0 || $.inArray(file.mime, mimes) !== -1) 
					&& file.mime.indexOf('text/rtf')
					&& (!self.onlyMimes.length || $.inArray(file.mime, self.onlyMimes) !== -1)
					&& file.read && file.write ? file : null;
			});
		},
		
		/**
		 * Open dialog with textarea to edit file
		 *
		 * @param  String  id       dialog id
		 * @param  Object  file     file object
		 * @param  String  content  file content
		 * @return $.Deferred
		 **/
		dialog = function(id, file, content, imageEditor) {

			var ta, dfrd = $.Deferred();
				if (imageEditor) {
					var src=URL.createObjectURL(content);
					ta   = $('<img id="'+id+'-img" src="'+src+'" />');
				} else {
					ta   = $('<textarea class="elfinder-file-edit" rows="20" id="'+id+'-ta">'+fm.escape(content)+'</textarea>');
				}
				var save = function() {
					ta.editor && ta.editor.save(ta[0], ta.editor.instance);
					dfrd.resolve(ta.getContent());
					ta.elfinderdialog('close');
				},
				cancel = function() {
					dfrd.reject();
					ta.elfinderdialog('close');
				},
				opts = {
					title   : file.name,
					width   : self.options.dialogWidth || $(window).width()*0.97,
					buttons : {},
					close   : function() { 
						ta.editor && ta.editor.close(ta[0], ta.editor.instance);
						$(this).elfinderdialog('destroy'); 
					},
					open    : function() { 
						fm.disable();
						ta.focus(); 
						ta[0].setSelectionRange && ta[0].setSelectionRange(0, 0);
						ta.editor && ta.editor.load(ta[0]);
					}
					
				};
				
				ta.getContent = function() {
					return ta.val()
				}
				console.log('check config for editors',self.options.editors,file.mime);
					
				$.each(self.options.editors || [], function(i, editor) {
					if ($.inArray(file.mime, editor.mimes || []) !== -1 
					&& typeof editor.load == 'function'
					&& typeof editor.save == 'function') {
						console.log('have editor',editor);
						ta.editor = {
							load     : editor.load,
							save     : editor.save,
							close    : typeof editor.close == 'function' ? editor.close : function() {},
							instance : null
						}
						
						return false;
					}
				});
				
				if (!ta.editor) {
					ta.keydown(function(e) {
						var code = e.keyCode,
							value, start;
						
						e.stopPropagation();
						if (code == 9) {
							e.preventDefault();
							// insert tab on tab press
							if (this.setSelectionRange) {
								value = this.value;
								start = this.selectionStart;
								this.value = value.substr(0, start) + "\t" + value.substr(this.selectionEnd);
								start += 1;
								this.setSelectionRange(start, start);
							}
						}
						
						if (e.ctrlKey || e.metaKey) {
							// close on ctrl+w/q
							if (code == 81 || code == 87) {
								e.preventDefault();
								cancel();
							}
							if (code == 83) {
								e.preventDefault();
								save();
							}
						}
						
					})
				}
				
				opts.buttons[fm.i18n('Save')]   = save;
				opts.buttons[fm.i18n('Cancel')] = cancel
				
				fm.dialog(ta, opts).attr('id', id);
				return dfrd.promise();
		},
		
		/**
		 * Get file content and
		 * open dialog with textarea to edit file content
		 *
		 * @param  String  file hash
		 * @return jQuery.Deferred
		 **/
		edit = function(file) {
			var hash   = file.hash,
				opts   = fm.options,
				dfrd   = $.Deferred(), 
				data   = {cmd : 'file', target : hash},
				url    = fm.url(hash) || fm.options.url,
				id    = 'edit-'+fm.namespace+'-'+file.hash,
				d = fm.getUI().find('#'+id), 
				error;
			
			
			if (d.length) {
				d.elfinderdialog('toTop');
				return dfrd.resolve();
			}
			
			if (!file.read || !file.write) {
				error = ['errOpen', file.name, 'errPerm']
				fm.error(error)
				return dfrd.reject(error);
			}
			if (pouchTransport.utils.isPouch(file.hash) && (file.mime.indexOf('image/jpeg') === 0|| 
				file.mime.indexOf('image/gif') === 0|| file.mime.indexOf('image/png') === 0))  {
				console.log('editing pouch bitmap image');
				pouchTransport.utils.getAttachment(file.hash).then(function(data) {
					console.log('eloaded image');
					dialog(id,file,data,true)
					.done(function(dataToSave) {
						console.log('done dialog now SAVE');
						pouchTransport.utils.save(file,dataToSave);
						dfrd.resolve(dataToSave);
					}).fail(function(error) {
						dfrd.reject(error);
					})
				});
			} else {
				fm.request({
					data   : {cmd : 'get', target  : hash},
					notify : {type : 'openfile', cnt : 1},
					syncOnFail : true
				})
				.done(function(data) {
					dialog(id, file, data.content)
						.done(function(content) {
							fm.request({
								options : {type : 'post'},
								data : {
									cmd     : 'put',
									target  : hash,
									content : content
								},
								notify : {type : 'save', cnt : 1},
								syncOnFail : true
							})
							.fail(function(error) {
								dfrd.reject(error);
							})
							.done(function(data) {
								data.changed && data.changed.length && fm.change(data);
								dfrd.resolve(data);
							});
						})
				})
				.fail(function(error) {
					dfrd.reject(error);
				})
			}
			return dfrd.promise();
		};
	
	
	
	this.shortcuts = [{
		pattern     : 'ctrl+e'
	}];
	
	this.init = function() {
		this.onlyMimes = this.options.mimes || []
	}
	
	this.getstate = function(sel) {
		var sel = this.files(sel),
			cnt = sel.length;

		return !this._disabled && cnt && filter(sel).length == cnt ? 0 : -1;
	}
	
	this.exec = function(hashes) {
		//console.log('EDIT',hashes,this.files(hashes));
		var files = filter(this.files(hashes)),
			list  = [],
			file;

		if (this.disabled()) {
			return $.Deferred().reject();
		}
		//console.log('EDIT files',files);
		while ((file = files.shift())) {
			list.push(edit(file));
		}
		
		return list.length 
			? $.when.apply(null, list)
			: $.Deferred().reject();
	}

}