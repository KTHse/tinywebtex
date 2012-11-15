tinyMCEPopup.requireLangPack();

/*
 * Add trim() to strings for browsers which don't have them.
 */
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

var TinyWebtexDialog = {
    webtex_url : "/webtex",
    max_expr : 2000,

    /*
     * Set up the window and populate data from selection in editor if any.
     */
    init : function() {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            div = document.createElement('div'),
            img;

        TinyWebtexDialog.webtex_url = tinyMCEPopup.getWindowArg('webtex_url');
        f.tex.onkeyup = TinyWebtexDialog.update;
        f.uuid.value = ed.dom.uniqueId('uuid-');
        div.innerHTML = ed.selection.getContent();

        f.tex.focus();

        if (!div.childNodes.length) {
            return;
        }

        img = div.childNodes.item(0);
        if ((img.nodeName == 'IMG') && img.className.match("webtex")) {
            f.tex.value = img.alt.substr(4);
            f.uuid.value = img.getAttribute('longdesc');
        } else if (img.nodeType == Node.TEXT_NODE) {
            f.tex.value = img.textContent;
        }
    },

    /*
     * Send an asynchronous call to WebTex backend service for image,
     * will update the editor if successfull, indicate error states
     * otherwise.
     */
    callWebTex : function(img) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                img.webtex = {
                    log : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-log")),
                    tex : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-tex")),
                    depth : xmlhttp.getResponseHeader("X-MathImage-depth")
                };
                TinyWebtexDialog.updateCounter(img);            
                if (img.webtex.log == "OK") {
                    TinyWebtexDialog.showOk();            
                    TinyWebtexDialog.updateEditor(img);
                } else {
                    TinyWebtexDialog.showError(img.webtex.log);
                }
            }
        };
        xmlhttp.open("GET", img.src, true);
        xmlhttp.send();
    },

    /*
     * Updates the editor with the new image, used as callback from callWebTex.
     */
    updateCounter : function(img) {
        var c = document.getElementById("counter"),
            l = TinyWebtexDialog.max_expr - img.src.split("?tex=")[1].length

        c.textContent = l;
        if (c.textContent < 0) {
            c.className = "error";
        }
    },
    
    /*
     * Updates the editor with the new image, used as callback from callWebTex.
     */
    updateEditor : function(img) {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            old = ed.dom.select('img[longdesc=' + f.uuid.value + ']');

        img.className = "webtex dp" + img.webtex.depth.replace("-", "_");
        ed.undoManager.add();
        if (old.length) {
            ed.dom.replace(img, old[0]);
        } else {
            ed.selection.setNode(img);
        }
    },

    
    showError : function(error) {
        var e = document.getElementById("error"), 
            str = error.substr(2).split(/.\Wl.[0-9]+\W/g);
        e.textContent = str[0];
        if (str.length > 1) {
            if (str[1].length > 30) {
                e.innerHTML += ': <i>...' + str[1].slice(-30) + '</i>';
            } else {
                e.innerHTML += ': <i>' + str[1] + '</i>';
            }
        }
    },


    showOk : function() {
        document.getElementById("error").textContent = '';
    },


    /*
     * Callback for keyup events in tex field of dialog. Will call for
     * a new image from WebTex if we believe that the contents have 
     * changed.
     */
    update : function() {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            tex = f.tex.value.trim(), 
            old = ed.dom.select('img[longdesc=' + f.uuid.value + ']'),
            img;

        if (tex == "" && old.length) {
            ed.dom.remove(old[0]);
        }

        if (tex == "") {
            TinyWebtexDialog.showOk();            
            return;
        }

        img = ed.dom.create('img', {
            'src' : TinyWebtexDialog.webtex_url + '/WebTex?tex=' + encodeURIComponent(tex),
            'alt' : 'tex:' + tex,
            'class' : 'webtex',
            'longdesc' : f.uuid.value
        });
        TinyWebtexDialog.callWebTex(img);
    },
    
    insertAtCursor : function(str) {
        var f = document.forms[0],
            el = f.tex,
            val = el.value, 
            endIndex, 
            range;
        if (typeof el.selectionStart != "undefined" && typeof el.selectionEnd != "undefined") {
            endIndex = el.selectionEnd;
            el.value = val.slice(0, endIndex) + str + val.slice(endIndex);
            el.selectionStart = el.selectionEnd = endIndex + str.length;
        } else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
            // IE <= 8.
            el.focus();
            range = document.selection.createRange();
            range.collapse(false);
            range.text = str;
            range.select();
        }
    },

    /*
     * Callback for the done button in dialog. 
     */
    done : function() {
        tinyMCEPopup.close();
    }
};

tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);
