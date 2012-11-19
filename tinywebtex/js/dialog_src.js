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
    url : null,
    size : null,
    max : null,
    timer : null,
    xmlhttp : null,

    /*
     * Set up the window and populate data from selection in editor if any.
     */
    init : function() {
        var tw = this,
            f = document.forms[0],
            ed = tinyMCEPopup.editor,
            div = ed.dom.create('div', {}, ed.dom.get("tw_stupid_ie_workaround").innerHTML),
            img;

        tw.url = tinyMCEPopup.getWindowArg('webtex_url');
        tw.size = tinyMCEPopup.getWindowArg('default_size');
        tw.max = tinyMCEPopup.getWindowArg('max_length');
        f.tex.onkeyup = f.size.onchange = f.style.onchange = tw.update;

        if (!div.childNodes.length) {
            f.uuid.value = tw.randomId();
        } else {
            img = div.childNodes.item(0);
            if ((img.nodeName == 'IMG') && img.className.match("webtex")) {
                f.tex.value = tw.getTex(img);
                f.size.value = tw.getSize(img);
                f.uuid.value = img.id;
                f.style.value = tw.isDisplayStyle(f.tex.value) ? "display" : "inline" ;
            } else if (img.nodeType == Node.TEXT_NODE) {
                f.uuid.value = tw.randomId();
                f.tex.value = img.textContent;
            }
        }
        tw.initShortcuts();            
        tw.update();            
        f.tex.focus();
    },
    
    
    randomId: function() {
        var CHARS = "0123456789abcdef",
            id = "uuid-", i;
            
        for (i = 0; i < 32; i++) {
            id += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        return id;
    },
    

    getSize: function(img) {
        var s = img.src.split(/[\?&]D=/g)[1].substr(0,1);
        if (s) {
            return s;
        }
        return TinyWebtexDialog.size;
    },
    
    
    getTex: function(img) {
        return img.alt.substr(4);
    },
    
    
    getUuid: function(img) {
        if (img.id) {
            return img.id;
        }    
        return TinyWebtexDialog.randomId();
    },


    /*
     * Send an asynchronous call to WebTex backend service for image,
     * will update the editor if successful, indicate error states
     * otherwise.
     */
    callWebTex : function(img) {
        var xmlhttp = new XMLHttpRequest(),
            tw = this;
            
        if (tw.xmlhttp != null) {
            tw.xmlhttp.abort();
        }

        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState < 4) {
                tw.inProgress(true);
            } else if (xmlhttp.readyState == 4) {
                tw.inProgress(false);
                if (xmlhttp.status == 200 || xmlhttp.status == 304) {
                    img.webtex = {
                        log : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-log")),
                        tex : decodeURIComponent(xmlhttp.getResponseHeader("X-MathImage-tex")),
                        depth : xmlhttp.getResponseHeader("X-MathImage-depth"),
                        width : xmlhttp.getResponseHeader("X-MathImage-width"),
                        height : xmlhttp.getResponseHeader("X-MathImage-height")
                    };
                    tw.updateCounter(img);            
                    if (img.webtex.log == "OK") {
                        tw.isOk(true);            
                        tw.updateEditor(img);
                    } else {
                        tw.isOk(false, img.webtex.log);            
                    }
                }
            }
        };
        tw.xmlhttp = xmlhttp;
        xmlhttp.open("GET", img.src, true);
        xmlhttp.send();
    },
    
    
    /*
     * Updates the URL length counter.
     */
    updateCounter : function(img) {
        var c = document.getElementById("counter"), 
            l = this.max;
        
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
            old = ed.dom.get(f.uuid.value);

        img.className = "webtex dp" + img.webtex.depth.replace("-", "_");
        
        if (img.webtex.width && img.webtex.height) {
            img.width = img.webtex.width;
            img.height = img.webtex.height;
        }
                
        ed.undoManager.add();
        if (ed.dom.get('tw_stupid_ie_workaround')) {
            ed.dom.replace(img, ed.dom.get('tw_stupid_ie_workaround'));
        } else if (old) {
            ed.dom.replace(img, old);
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


    isDisplayStyle : function(tex) {
        return tex.match(/^\s*\\displaystyle.*/g);
    },
    
    
    setStyle : function(tex, style) {
        var tw = TinyWebtexDialog;

        if (style == "display" && ! tw.isDisplayStyle(tex)) {
            return "\\displaystyle " + tex;
        } else if (style == "inline" && tw.isDisplayStyle(tex)) {
            return tex.replace(/\s*\\displaystyle\s*/g, "");
        }
        return tex;
    },


    /*
     * Callback for keyup events in tex field of dialog. Will call for
     * a new image from WebTex if we believe that the contents have 
     * changed.
     */
    update : function() {
        var tw = TinyWebtexDialog,
            f = document.forms[0],
            ed = tinyMCEPopup.editor,
            size = f.size.value,
            old = ed.dom.get(f.uuid.value),
            tex;
            
        f.tex.value = tw.setStyle(f.tex.value, f.style.value),
        tex = f.tex.value.trim();
        
        if (tex == "") {
            // Expression is empty, reset status.
            tw.updateCounter();
            tw.isOk(true);

            if (old) {
                // Remove any old image.
                ed.dom.remove(old);
                ed.execCommand('mceRepaint', false);
            }
            return;
        }

        if (old &&
            tex == tw.getTex(old) && 
            size == tw.getSize(old)) {
            // No changes compared to old image.
            return;
        }

        // New or modified image.
        tw.callWebTex(
            ed.dom.create('img', {
                id : f.uuid.value,
                'src' : "{0}/WebTex?D={1}&tex={2}".format(tw.url, size, encodeURIComponent(tex)),
                'alt' : 'tex:' + tex,
                'class' : 'webtex'
            })
        );
    },
    
    
    /*
     * Inserts string at cursor in tex buffer.
     */
    insertAtCursor : function(str) {
        var tex = document.forms[0].tex,
            end,
            range;

        if (typeof tex.selectionStart != "undefined" && typeof tex.selectionEnd != "undefined") {
            end = tex.selectionEnd;
            tex.value = tex.value.slice(0, end) + str + tex.value.slice(end);
            tex.selectionStart = tex.selectionEnd = end + str.length;
        } else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
            // IE <= 8.
            tex.focus();
            range = document.selection.createRange();
            range.collapse(false);
            range.text = str;
            range.select();
        }
    },

    
    closeMenues: function() {
        var menues = document.getElementsByClassName("twMenuPane"),
            i;
            
        for (i = 0; i < menues.length; i++) {
            menues.item(i).style.display = "none";
        }
    },


    initShortcuts : function() {
        var tw = this,
            entries = document.getElementsByClassName("twMenuEntry"), 
            menues = document.getElementsByClassName("twMenu"),
            panes = document.getElementsByClassName("twMenuPane"),
            i;
            
        for (i = 0; i < panes.length; i++) {
            panes.item(i).onmouseout = function() {
                tw.timer = setTimeout(tw.closeMenues, 150);
            };
            panes.item(i).onmouseover = function() {
                clearTimeout(tw.timer);
            };
        }
        for (i = 0; i < entries.length; i++) {
            entries.item(i).onclick = function() {
                tw.closeMenues();
                tw.insertAtCursor(this.title);
                tw.update(); 
                document.forms[0].tex.focus();           
                return false;
            };          
        }
        for (i = 0; i < menues.length; i++) {
            menues.item(i).onclick = function() {
                var el = document.getElementById(this.getAttribute('href').substr(1));
                if (el.style.display == "block") {
                    tw.closeMenues();
                } else {
                    tw.closeMenues();
                    el.style.display = "block";
                }
                return false;
            };
        }
    },


    /*
     * Callback for the done button in dialog. 
     */
    done : function() {
        ed.dom.remove(ed.dom.get("tw_ie_stupid_workaround"));
        tinyMCEPopup.close();
    }
};

tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);