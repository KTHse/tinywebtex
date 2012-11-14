tinyMCEPopup.requireLangPack();

if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}

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

        f.tex.focus();

        if (!div.childNodes.length) {
            return;
        }

        img = div.childNodes.item(0);
        if ((img.nodeName == 'IMG') && (img.className.search("webtex") >= 0)) {
            f.tex.value = img.alt.substr(4);
            f.uuid.value = img.getAttribute('longdesc');
        } else if (img.nodeType == Node.TEXT_NODE) {
            f.tex.value = img.textContent;
        }
    },

    httpRequest : function(img) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                img.webtex = {
                    log : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-log")),
                    tex : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-tex")),
                    depth : xmlhttp.getResponseHeader("X-MathImage-depth")
                };
                if (img.webtex.log == "OK") {
                    TinyWebtexDialog.updateEditor(img);
                } else {
                    unset(img);
                }
            }
        };
        xmlhttp.open("GET", img.src, true);
        xmlhttp.send();
    },

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

    update : function() {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            old = ed.dom.select('img[longdesc=' + f.uuid.value + ']'),
            tex = f.tex.value.trim(), 
            img;

        if (tex == "" && old.length) {
            ed.dom.remove(old[0]);
            return;
        }

        if (tex == "" || (old.length && tex == old[0].alt.substr(4))) {
            return;
        }

        img = ed.dom.create('img', {
            'src' : TinyWebtexDialog.webtex_url + '/WebTex?tex=' + encodeURIComponent(f.tex.value),
            'alt' : 'tex:' + f.tex.value.trim(),
            'class' : 'webtex',
            'longdesc' : f.uuid.value
        });
        TinyWebtexDialog.httpRequest(img);
    },

    done : function() {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            img = ed.dom.select('img[longdesc=' + f.uuid.value + ']');
//        img.id = null;
        tinyMCEPopup.close();
    }
};

tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);
