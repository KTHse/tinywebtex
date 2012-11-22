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
    span: null,

    /*
     * Set up the window and populate data from selection in editor if any.
     */
    init : function() {
        var tw = this,
            ed = tinyMCEPopup.editor;

        tw.url = tinyMCEPopup.getWindowArg('webtex_url');
        tw.size = tinyMCEPopup.getWindowArg('default_size');
        tw.max = tinyMCEPopup.getWindowArg('max_length');
        tw.span = tinyMCEPopup.getWindowArg('marker');

        $(ed.dom.create('div', {}, ed.dom.get(tw.span).firstChild))
            .children('img.webtex:first').each(function() {
	            $("#tex").val(tw.getTex(this));
	            $("#size").val(tw.getSize(this));
	            $("#style").val(tw.isDisplayStyle($("#tex").val()) ? "display" : "inline");
        });

        tw.initShortcuts();            
        tw.update();
        $("#tex").keyup(tw.update).focus();
        $("#size").change(tw.update);
        $("#style").change(tw.update);
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
    
    
    /*
     * Send an asynchronous call to WebTex backend service for image,
     * will update the editor if successful, indicate error states
     * otherwise.
     */
    callWebTex : function(img) {
        var tw = this;
            
        if (tw.xmlhttp != null) {
            tw.xmlhttp.abort();
        }
        
        tw.inProgress(true);
        $.ajax({url : img.src,
                beforeSend: function (xhr) {
                	tw.xmlhttp = xhr;
                }})
            .done(function(d, s, xhr) {
                tw.xmlhttp = null;
                tw.inProgress(false);
                img.webtex = {
                    log : decodeURIComponent(xhr.getResponseHeader("X-MathImage-log")),
                    tex : decodeURIComponent(xhr.getResponseHeader("X-MathImage-tex")),
                    depth : xhr.getResponseHeader("X-MathImage-depth"),
                    width : xhr.getResponseHeader("X-MathImage-width"),
                    height : xhr.getResponseHeader("X-MathImage-height")
                };
                tw.updateCounter(img);            
                if (img.webtex.log == "OK") {
                    tw.isOk(true);            
                    tw.updateEditor(img);
                } else {
                    tw.isOk(false, img.webtex.log);            
                }
            });
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
        var ed = tinyMCEPopup.editor,
            tw = this,
            span = ed.dom.get(tw.span);

        img.className = "webtex dp" + img.webtex.depth.replace("-", "_");
        
        if (img.webtex.width && img.webtex.height) {
            img.width = img.webtex.width;
            img.height = img.webtex.height;
        }
                
        ed.undoManager.add();
        ed.dom.setHTML(span, img.outerHTML);
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
            span = ed.dom.get(tw.span),
            tex;
            
        f.tex.value = tw.setStyle(f.tex.value, f.style.value),
        tex = f.tex.value.trim();
        
        if (tex == "") {
            // Expression is empty, reset status.
            tw.updateCounter();
            tw.isOk(true);
            ed.dom.setHTML(span, "");
            return;
        }

        if (span.firstChild &&
            tex == tw.getTex(span.firstChild) && 
            size == tw.getSize(span.firstChild)) {
            // No changes compared to old image.
            return;
        }

        // New or modified image.
        tw.callWebTex(
            ed.dom.create('img', {
                'src' : "{0}/WebTex?D={1}&tex={2}".format(tw.url, size, encodeURIComponent(tex)),
                'alt' : 'tex:' + tex,
                'class' : 'webtex'
            })
        );
    },
    
    
    closeMenues: function() {
    	$(".twMenuPane").each(function() {
    		$(this).css('display', 'none');
    	});
    },


    initShortcuts : function() {
        var tw = this;
        
        $(".twMenuPane").each(function() {
            $(this).mouseout(function() {
            	tw.timer = setTimeout(tw.closeMenues, 150);
            }).mouseover(function() {
            	clearTimeout(tw.timer);
            });
        });
        $(".twMenuEntry").each(function() {
        	$(this).click(function() {
        		$("#tex").insertAtCaret(this.title);
                tw.closeMenues();
                tw.update(); 
                $("#tex").focus();
        	});
        });
        $(".twMenu").each(function() {
            $(this).click(function() {
            	var el = $($(this).attr('href'));
                if (el.css('display') == "block") {
                    tw.closeMenues();
                } else {
                    tw.closeMenues();
                	el.css('display', 'block');
                }
                return false;
            });      	
        });
    },


    /*
     * Callback for the done button in dialog. 
     */
    done : function() {
        tinyMCEPopup.close();
    }
};


tinyMCEPopup.onInit.add(TinyWebtexDialog.init, TinyWebtexDialog);
