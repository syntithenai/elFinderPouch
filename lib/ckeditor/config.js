﻿/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	config.plugins = 'dialogui,dialog,a11yhelp,about,basicstyles,blockquote,clipboard,panel,floatpanel,menu,contextmenu,div,elementspath,enterkey,entities,popup,filebrowser,find,floatingspace,listblock,button,richcombo,format,fakeobjects,forms,horizontalrule,htmlwriter,image,indent,indentlist,justify,link,list,liststyle,magicline,maxheight,maximize,pagebreak,pastefromword,pastetext,print,removeformat,resize,showblocks,showborders,sourcearea,specialchar,stat,stylescombo,symbol,tab,table,tabletools,tableresize,textselection,texttransform,toolbar,undo,wordcount,wysiwygarea,xdsoft_translater,lineutils,widget,codesnippet,eqneditor,qrc,youtube,iframe,templates,leaflet';
	config.skin = 'moono';
	// %REMOVE_END%

	// Define changes to default configuration here.
	// For complete reference see:
	// http://docs.ckeditor.com/#!/api/CKEDITOR.config

	// The toolbar groups arrangement, optimized for two toolbar rows.
	config.toolbarGroups = [
		{ name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
		{ name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
		{ name: 'links' },
		{ name: 'insert' },
		{ name: 'forms' },
		{ name: 'tools' },
		{ name: 'document',	   groups: [ 'mode', 'document', 'doctools' ] },
		{ name: 'others' },
		'/',
		{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
		{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },
		{ name: 'styles' },
		{ name: 'colors' },
		{ name: 'about' }
	];

	// Remove some buttons provided by the standard plugins, which are
	// not needed in the Standard(s) toolbar.
	config.removeButtons = 'Underline,Subscript,Superscript';

	// Set the most common block elements.
	config.format_tags = 'p;h1;h2;h3;pre';

	// Simplify the dialog windows.
	config.removeDialogTabs = 'image:advanced;link:advanced';
};
