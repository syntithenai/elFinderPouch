/**
 * @license Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.html or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	
	// %REMOVE_START%
	// The configuration options below are needed when running CKEditor from source files.
	//,about,a11yhelp,dialogadvtab,basicstyles,bidi
	//,colorbutton,colordialog,flash,,smiley,iframe,language,selectall,scayt,slideshow,tliyoutube
	config.plugins ='dialogui,dialog,blockquote,clipboard,button,panelbutton,panel,floatpanel,templates,menu,contextmenu,div,resize,toolbar,elementspath,enterkey,entities,popup,filebrowser,find,fakeobjects,floatingspace,listblock,richcombo,font,forms,format,horizontalrule,htmlwriter,wysiwygarea,image,indent,indentblock,indentlist,justify,menubutton,link,list,liststyle,magicline,maximize,newpage,pagebreak,pastetext,pastefromword,preview,print,removeformat,save,showblocks,showborders,sourcearea,specialchar,stylescombo,tab,table,tabletools,undo,wsc,lineutils,widget,codesnippet'; //',pbckcode,custimage,divarea,docprops,eqneditor,fastimage,floating-tools,gg,imageresize,inlinecancel,inlinesave,insertpre,symbol,textselection,lite,mathjax,maxheight,mathedit,onchange,qrc,resizewithwindow,sharedspace,stat,stylesheetparser,stylesheetparser-fixed,tableresize,texttransform,uploadcare,wordcount,sourcedialog';
	config.skin = 'moono';
	config.disableNativeSpellChecker = false;
	config.dtoolbar = [
    { name: 'document', items: [ 'Source', '-', 'NewPage', 'Preview', '-', 'Templates' ] },
    { name: 'clipboard', items: [ 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo' ] },
    '/',
    { name: 'basicstyles', items: [ 'Bold', 'Italic' ] }
];
	// %REMOVE_END%

	// Define changes to default configuration here. For example:
	// config.language = 'fr';
	// config.uiColor = '#AADC6E';
};
