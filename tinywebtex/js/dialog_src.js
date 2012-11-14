tinyMCEPopup.requireLangPack();

var TinyWebtexDialog = {
	webtex_url : "/webtex",
	
	init : function() {
		var f = document.forms[0],
			ed = tinyMCEPopup.editor,
			div = document.createElement('div'),
			img;

		TinyWebtexDialog.webtex_url = tinyMCEPopup.getWindowArg('webtex_url');
		f.tex.onkeyup = TinyWebtexDialog.update;
		f.uuid.value = ed.dom.uniqueId('uuid-');
		div.innerHTML = ed.selection.getContent();

		if (! div.childNodes.length) {
			return;			
		}

		img = div.childNodes.item(0);
		if ((img.nodeName == 'IMG') && (img.className.search("webtex") >= 0)) {
			f.tex.value = img.alt.substr(4);
			f.uuid.value = img.getAttribute(longdesc);
		} else if (img.nodeType == Node.TEXT_NODE) {
			f.tex.value = img.textContent;
		}
	},

	httpRequest : function(img) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", img.src, false);
		xmlhttp.send();
		if (xmlhttp.status == "200") {
			img.webtex = {
				log : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-log")),
				tex : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-tex")),
				depth : xmlhttp.getResponseHeader("X-MathImage-depth")
			};
			return true;
		}
		return false;
	},
	
	update : function() {
		var f = document.forms[0],
			ed = tinyMCEPopup.editor,
		    img, old;

		if (f.tex.value == "") {
			old = ed.dom.select('img[longdesc=' + f.uuid.value + ']');
			ed.dom.remove(old);
		} 
		    
		img = ed.dom.create(
	    	'img', 
	    	{
	    		'src' : TinyWebtexDialog.webtex_url + '/WebTex?tex=' + encodeURIComponent(f.tex.value),
	    		'alt' : 'tex:' + f.tex.value,
	    		'class' : 'webtex',
	    		'longdesc' : f.uuid.value
	    	}
    	);

        if (TinyWebtexDialog.httpRequest(img)) {
        	old = ed.dom.select('img[longdesc=' + f.uuid.value + ']');
    		ed.undoManager.add();
        	if (old.length) {
        		ed.dom.replace(img, old[0]);
        	} else {
        		ed.selection.setNode(img);
        	}
		} 
	},

	done : function() {
		var f = document.forms[0],
			ed = tinyMCEPopup.editor,
	    	img = ed.dom.select('img[longdesc=' + f.uuid.value + ']');
    	img.id = null;
    	tinyMCEPopup.close();
	}
};

tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);
