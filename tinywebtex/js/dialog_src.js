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
                if (img.webtex.log == "OK") {
                    img.className = "webtex dp" + img.webtex.depth.replace("-", "_");
                    TinyWebtexDialog.updateEditor(img);
                } else {
                    unset(img);
                }
            }
        };
        xmlhttp.open("GET", img.src, true);
        xmlhttp.send();
    },

    /*
     * Updates the editor with the new image, used as callback from callWebTex.
     */
    updateEditor : function(img) {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            old = ed.dom.select('img[longdesc=' + f.uuid.value + ']');

        ed.undoManager.add();
        if (old.length) {
            ed.dom.replace(img, old[0]);
        } else {
            ed.selection.setNode(img);
        }
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

        if (tex == "" || (old.length && tex == old[0].alt.substr(4))) {
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

    /*
     * Callback for the done button in dialog. 
     */
    done : function() {
        tinyMCEPopup.close();
    }
};

tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);
