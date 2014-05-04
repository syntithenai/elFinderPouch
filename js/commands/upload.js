"use strict";
/**
 * @class elFinder command "upload"
 * Upload files using iframe or XMLHttpRequest & FormData.
 * Dialog allow to send files using drag and drop
 *
 * @type  elFinder.command
 * @author  Dmitry (dio) Levashov
 */
elFinder.prototype.commands.upload = function() {
	var hover = this.fm.res('class', 'hover');
	
	this.disableOnSearch = true;
	this.updateOnSelect  = false;
	
	// Shortcut opens dialog
	this.shortcuts = [{
		pattern     : 'ctrl+u'
	}];
	
	/**
	 * Return command state
	 *
	 * @return Number
	 **/
	this.getstate = function() {
		return !this._disabled && this.fm.cwd().write ? 0 : -1;
	}
	
	
	this.exec = function(data) {
		var fm = this.fm,
			upload = function(data) {
				dialog.elfinderdialog('close');
				fm.upload(data)
					.fail(function(error) {
						dfrd.reject(error);
					})
					.done(function(data) {
						dfrd.resolve(data);
					});
			},
			dfrd, dialog, input, button, dropbox;
		
		if (this.disabled()) {
			return $.Deferred().reject();
		}
		
		if (data && (data.input || data.files || data.event)) {
			console.log('UPLOAD PASS OFF',data);
			return fm.upload(data);
		}
		
		dfrd = $.Deferred();
		
		
		var input1 = $('<input type="file" multiple="true"  />')
			.change(function(e) {
				//upload({input : input1[0]});
				upload({event : e});
			});
		var input2 = $('<input type="file"  webkitdirectory />')
			.change(function(e) {
				//upload({input : input2[0]});
				upload({event : e});
			});

		var button1 = $('<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class="ui-button-text">'+fm.i18n('selectForUpload')+'</span></div>')
			.append($('<form/>').append(input1))
			.hover(function() {
				button1.toggleClass(hover)
			})
		var button2 = $('<div class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class="ui-button-text">'+fm.i18n('selectFolderForUpload')+'</span></div>')
			.append($('<form/>').append(input2))
			.hover(function() {
				button2.toggleClass(hover)
			})
	
		dialog = $('<div class="elfinder-upload-dialog-wrapper"/>')
			.append(button1).append(button2);
		
		if (fm.dragUpload) {
			dropbox = $('<div class="ui-corner-all elfinder-upload-dropbox">'+fm.i18n('dropFiles')+'</div>')
				.prependTo(dialog)
				.after('<div class="elfinder-upload-dialog-or">'+fm.i18n('or')+'</div>')[0];

			dropbox.addEventListener('dragenter', function(e) {
				e.stopPropagation();
			  	e.preventDefault();
				$(dropbox).addClass(hover);
			}, false);

			dropbox.addEventListener('dragleave', function(e) {
				e.stopPropagation();
			  	e.preventDefault();
				$(dropbox).removeClass(hover);
			}, false);

			dropbox.addEventListener('dragover', function(e) {
				e.stopPropagation();
			  	e.preventDefault();
			}, false);

			dropbox.addEventListener('drop', function(e) {
				e.stopPropagation();
			  	e.preventDefault();
			
				//upload({files : e.dataTransfer.files});
				upload({event : e});
			}, false);
			
		}
		
		fm.dialog(dialog, {
			title          : this.title,
			modal          : true,
			resizable      : false,
			destroyOnClose : true
		});
			
		return dfrd;
	}

}