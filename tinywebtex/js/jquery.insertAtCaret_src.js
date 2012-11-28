(function( $ ) {
    $.fn.insertAtCaret = function(str) {
        return this.each(function() {
	        var el = this,
	            end,
	            start,
	            range;
    
	        if (typeof el.selectionStart != "undefined" && typeof el.selectionEnd != "undefined") {
                    el.focus();
	            end = el.selectionEnd;
	            start = el.selectionStart;
	            el.value = el.value.slice(0, start) + str + el.value.slice(end);
	            el.selectionStart = el.selectionEnd = start + str.length;
	        } else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
	            // IE <= 8.
	            el.focus();
	            range = document.selection.createRange();
	            range.text = str;
	            range.collapse(false);
	            range.select();
	        }   
        })
    };
})( jQuery );
