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
 * JavaScript object driving the WebTex dialog.
 */
var TinyWebtexDialog = {
    url : null,
    size : null,
    max : null,
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
	            $("#size").val(tw.getSize(this));
                $("#style").val(tw.getTex(this)
                    .match(/^\s*\\textstyle.*/g) ? "inline" : "display");
                $("#tex").val(tw.getTex(this)
                    .replace(/^\s*\\displaystyle /g, '')
                    .replace(/^\s*\\textstyle /g, ''));
        });

        tw.initMenues();            
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
        return $.trim($(img).attr("alt").substr(4));
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
            })
            .error(function(d, s, xhr) {
                tw.xmlhttp = null;
                tw.inProgress(false);
            });
    },
    
    
    /*
     * Updates the URL length counter.
     */
    updateCounter : function(img) {
        var l = this.max;
        
        if (img) {
            l -= img.src.split(/[\?&]tex=/g)[1].length;
        }
        $("#counter")
            .text(l)
            .toggleClass("error", (l < 0));
    },
    
    
    /*
     * Updates the editor with the given image.
     */
    updateEditor : function(img) {
        var ed = tinyMCEPopup.editor,
            tw = this;

        $(img)
            .toggleClass("webtex", true)
            .addClass("dp" + img.webtex.depth.replace("-", "_"))
            .attr("width", img.webtex.width)
            .attr("height", img.webtex.height);

        ed.undoManager.add();
        ed.dom.setHTML(tw.span, img.outerHTML);
        ed.execCommand('mceRepaint', false);
    },

    
    /*
     * Indicates error state from WebTex service in UI.
     */
    isOk : function(isOk, str) {
        var e = $("#error")
                    .text("")
                    .toggleClass("alert", !isOk);

        if (!isOk) {
            $(e).text(str.substr(2).split(/.\Wl.[0-9]+\W/g)[0]);
        }
    },


    /*
     * Indicates whether there is ongoing fetch activity in UI or not.
     */
    inProgress : function(inProgress) {
        $("#error")
            .text("")
            .toggleClass("working", inProgress);
    },


    isDisplayStyle : function(tex) {
        return tex.match(/^\s*\\displaystyle.*/g);
    },


    /*
     * Callback for keyup events in tex field of dialog. Will call for
     * a new image from WebTex if we believe that the contents have 
     * changed.
     */
    update : function() {
        var tw = TinyWebtexDialog,
            ed = tinyMCEPopup.editor,
            span = ed.dom.get(tw.span),
            size = $("#size").val(),
            style = $("#style").val(),
            tex = $.trim($("#tex").val());

        tw.isOk(true);

        if (tex == "") {
            // Expression is empty, reset status.
            tw.updateCounter();
            ed.dom.setHTML(span, "");
            return;
        }

        if (style == "display") { 
            tex = "\\displaystyle " + tex
        } else {
            tex = "\\textstyle " + tex
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
                'src' : tw.url + "/WebTex?" + $.param({D : size, tex : tex}),
                'alt' : 'tex:' + tex,
                'class' : 'webtex'
            })
        );
    },
    
    
    initMenues : function() {
        var tw = this;
        
        $(".twMenuPane").each(function() {
            $(this).mouseout(function() {
                var menu = this;
            	menu.timer = setTimeout(function() {$(menu).hide();}, 150);
            }).mouseover(function() {
            	clearTimeout(this.timer);
            });
        });
        $(".twMenuEntry").each(function() {
        	$(this).click(function() {
        		$("#tex").insertAtCaret(this.title);
                tw.update(); 
                $(".twMenuPane").hide();
                $("#tex").focus();
                return false;
        	});
        });
        $(".twMenu").each(function() {
            $(this).click(function() {
            	var menu = $(this).attr('href');
            	$(".twMenuPane").not(menu).hide();
            	$(menu).toggle();
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
