/*
 * Copyright (C) 2012 KTH, Royal Institute of Technology (http://www.kth.se/)
 * 
 * This file is part of tinywebtex.
 * 
 * WebTex is free software: you can redistribute it and/or modify
 * it under the terms of a MIT style license which is included in 
 * the software.
 * 
 * Images handled by this plugin have these additional requirements on top
 * of the WebTex API documentation.
 * 
 * 1. The D parameter in the URL is assumed to have a 1 digit argument 0-9 only.
 * 2. The tex parameter is assumed to be the last parameter.
 * 3. An existing image to edit is assumed to have an "longdesc" attribute
 *    containing a random string uniquely identifying the image on the page,
 *    but will handle most common use cases when it does not exist.
 */

tinyMCEPopup.requireLangPack();


/*
 * Add trim() to strings for browsers which don't have them.
 */
if (!String.prototype.trim) {
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, '');
    }
}


/*
 * A sprintf kind of format() enabling constructions like:
 * "Apples: {0}, Pears: {1}".format("Golden Delicious", "Alexander Lucas");
 */
String.prototype.format = function() {
    var formatted = this;
    for (arg in arguments) {
        formatted = formatted.replace("{" + arg + "}", arguments[arg]);
    }
    return formatted;
};


/*    
 * JavaScript object driving the WebTex dialog.
 */
var TinyWebtexDialog = {
    webtex_url : "/webtex",
    max_expr : 2000,


    /*
     * Set up the window and populate data from selection in editor if any.
     */
    init : function() {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            div = ed.dom.create('div', {}, ed.selection.getContent()),
            img;

        TinyWebtexDialog.webtex_url = tinyMCEPopup.getWindowArg('webtex_url');
        f.tex.onkeyup = TinyWebtexDialog.update;
        f.size.onchange = TinyWebtexDialog.update;
        f.uuid.value = TinyWebtexDialog.randomId();

        f.tex.focus();

        if (!div.childNodes.length) {
            return;
        }

        img = div.childNodes.item(0);
        if ((img.nodeName == 'IMG') && img.className.match("webtex")) {
            f.tex.value = img.alt.substr(4);
            f.size.value = img.src.split(/[\?&]D=/g)[1].substr(0,1);
            f.uuid.value = img.getAttribute('longdesc');
        } else if (img.nodeType == Node.TEXT_NODE) {
            f.tex.value = img.textContent;
        }
        TinyWebtexDialog.update();            
    },
    
    
    randomId: function() {
        var CHARS = "0123456789abcdef",
            id = "uuid-", i;
            
        for (i = 0; i < 32; i++) {
            id += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        return id;
    },
    

    /*
     * Send an asynchronous call to WebTex backend service for image,
     * will update the editor if successful, indicate error states
     * otherwise.
     */
    callWebTex : function(img) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState < 4) {
                TinyWebtexDialog.inProgress(true);
            } else if (xmlhttp.readyState == 4) {
                TinyWebtexDialog.inProgress(false);
                if (xmlhttp.status == 200 || xmlhttp.status == 304) {
                    img.webtex = {
                        log : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-log")),
                        tex : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-tex")),
                        depth : xmlhttp.getResponseHeader("X-MathImage-depth")
                    };
                    TinyWebtexDialog.updateCounter(img);            
                    if (img.webtex.log == "OK") {
                        TinyWebtexDialog.isOk(true);            
                        TinyWebtexDialog.updateEditor(img);
                    } else {
                        TinyWebtexDialog.isOk(false, img.webtex.log);            
                    }
                }
            }
        };
        xmlhttp.open("GET", img.src, true);
        xmlhttp.send();
    },
    
    
    /*
     * Updates the URL length counter.
     */
    updateCounter : function(img) {
        var c = document.getElementById("counter"), 
            l = TinyWebtexDialog.max_expr;
        
        if (img) {
            l -= img.src.split(/[\?&]tex=/g)[1].length;
        }
        c.textContent = l;
        if (c.textContent < 0) {
            c.className = "error";
        }
    },
    
    
    /*
     * Updates the editor with the given image.
     */
    updateEditor : function(img) {
        var f = document.forms[0],
            ed = tinyMCEPopup.editor,
            old = ed.dom.select('img[longdesc={0}]'.format(f.uuid.value));

        img.className = "webtex dp" + img.webtex.depth.replace("-", "_");
        
        ed.undoManager.add();
        if (old.length) {
            ed.dom.replace(img, old[0]);
        } else {
            ed.selection.setNode(img);
        }
        ed.execCommand('mceRepaint', false);
    },

    
    /*
     * Indicates error state from WebTex service in UI.
     */
    isOk : function(isOk, str) {
        var e = document.getElementById("error");
        if (isOk) {
            e.className = "";
            e.textContent = "";
        } else {
            e.className = "alert";
            e.textContent = str.substr(2).split(/.\Wl.[0-9]+\W/g)[0]
        }
        // e.textContent = str[0];
        // if (str.length > 1) {
            // if (str[1].length > 30) {
                // e.innerHTML += ': <i>...{0}</i>'.format(str[1].slice(-30));
            // } else {
                // e.innerHTML += ': <i>{0}</i>'.format(str[1]);
            // }
        // }
    },


    /*
     * Indicates whether there is ongoing fetch activity in UI or not.
     */
    inProgress : function(inProgress) {
        var e = document.getElementById("error");

        e.textContent = "";
        if (inProgress) {
            e.className = "working";
        } else {
            e.className = "";
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
            s = f.size.value,
            old = ed.dom.select('img[longdesc={0}]'.format(f.uuid.value)),
            img;

        if (tex == "" && old.length) {
            ed.dom.remove(old[0]);
        }

        if (tex == "") {
            TinyWebtexDialog.updateCounter();
            TinyWebtexDialog.isOk(true);            
            return;
        }

        img = ed.dom.create('img', {
            'src' : "{0}/WebTex?D={1}&tex={2}".format(TinyWebtexDialog.webtex_url, s, encodeURIComponent(tex)),
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
