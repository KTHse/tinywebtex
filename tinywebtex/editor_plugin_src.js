/*
  Copyright: (C) 2012 KTH, Kungliga tekniska hogskolan, http://www.kth.se/

  This file is part of tinywebtex.
 */

(function() {
	// Load plugin specific language pack
	tinymce.PluginManager.requireLangPack('tinywebtex');

	tinymce.create('tinymce.plugins.TinyWebtexPlugin', {
		/**
		 * Initializes the plugin, this will be executed after the plugin has been created.
		 * This call is done before the editor instance has finished it's initialization so use the onInit event
		 * of the editor instance to intercept that event.
		 *
		 * @param {tinymce.Editor} ed Editor instance that the plugin is initialized in.
		 * @param {string} url Absolute URL to where the plugin is located.
		 */
		init : function(ed, url) {
			// Register the command so that it can be invoked by using tinyMCE.activeEditor.execCommand('mceExample');
			ed.addCommand('mceTinyWebtex', function() {
				ed.windowManager.open({
					file : url + '/dialog.htm',
					width : 500 + parseInt(ed.getLang('tinywebtex.delta_width', 0)),
					height : 200 + parseInt(ed.getLang('tinywebtex.delta_height', 0)),
					inline : 1
				}, {
					plugin_url : url, // Plugin absolute URL
					webtex_url : 'http://localhost:8080/webtex' // Base URL of WebTex service
				});
			});

			// Register example button
			ed.addButton('tinywebtex', {
				title : 'tinywebtex.desc',
				cmd : 'mceTinyWebtex',
				image : url + '/img/button.png'
			});

			// ctrl+e = cmd+e on a mac
            ed.addShortcut('ctrl+e', "Equation editor", 'mceTinyWebtex');
                        
            // Add a node change handler, selects the button in the UI when a image is selected
            ed.onNodeChange.add(function(ed, cm, n) {
                    cm.setActive('tinywebtex', n.nodeName == 'IMG' && n.className == 'webtex');
            });
		},

		/**
		 * Creates control instances based in the incomming name. This method is normally not
		 * needed since the addButton method of the tinymce.Editor class is a more easy way of adding buttons
		 * but you sometimes need to create more complex controls like listboxes, split buttons etc then this
		 * method can be used to create those.
		 *
		 * @param {String} n Name of the control to create.
		 * @param {tinymce.ControlManager} cm Control manager to use inorder to create new control.
		 * @return {tinymce.ui.Control} New control instance or null if no control was created.
		 */
		createControl : function(n, cm) {
			return null;
		},

		/**
		 * Returns information about the plugin as a name/value array.
		 * The current keys are longname, author, authorurl, infourl and version.
		 *
		 * @return {Object} Name/value array containing information about the plugin.
		 */
		getInfo : function() {
			return {
				longname : 'Tiny Webtex',
				author : 'infosys@kth.se',
				authorurl : 'http://www.kth.se/',
				infourl : 'http://www.kth.se/',
				version : "1.0"
			};
		}
	});

	// Register plugin
	tinymce.PluginManager.add('tinywebtex', tinymce.plugins.TinyWebtexPlugin);
})();