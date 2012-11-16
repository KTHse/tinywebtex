Tiny WebTex
-----------

A plugin for the open source WYSIWYG JavaScript editor TinyMCE (http://www.tinymce.com/).

## Install

Fetch a compiled release from the download directory or build from source,
see below. Unzip the package and copy the tinywebtex directory to the
TinyMCE plugin folder.

Register the `tinywebtex` plugin in the call to `tinyMCE.init`, as you
would with any other TinyMCE plugin, and add the `tinywebtex` button
to the toolbar. See the TinyMCE customization documentation for
details.

The source-files (*_src.css and *_src.js) are included in the package and can be
used for debugging purposes. However, without modification only the minimized 
versions of these files are used and the source versions can be deleted.


### Configuration

You configure the plugin by declaring global variables in your page before it
is used, se example below which includes the default values for these options.

```
<script type="text/javascript">
    WEBTEX_URL = '/webtex'; // Base URL of the WebTex service
    WEBTEX_SIZE = 1;        // Default WebTex image size ('D' parameter).
    WEBTEX_MAX_LEN = 2000;  // Max length of encoded TeX expression before warning.
</script>
```

`WEBTEX_URL = "/webtex"` A string pointing to the base URL of the WebTex Service.
Typically, this have to be on the same host (and port) in order to avoid 
cross-site-scripting (XSS) issues.

There are a number of options for proxying the WebTex application into
the same namespace as the site using TinyMCE to avoid XSS if you use Apache httpd,
like mod_jk or mod_proxy, see the Apache documentation for details. There should
be similar possibilities for other web servers.

`WEBTEX_SIZE = 1` The default WebTex image size (the 'D' parameter to the service).

`WEBTEX_MAX_LEN = 2000` The max length of the encoded TeX expression before the
interface warns the user that the expression is too long. The limit is not 
enforced however, but the interface warns the user that the expression is too long.

You have to consider the length of the base URI of your service and the browsers
using it. Internet Explorer has maximum lengths of 2083 characters for a URL, and
2048 characters in the path part of the URL. This is most likely the most 
restricting limitation of this parameter, but your WebTex servlet configuration
may also come into play.


## Build from source

To "build" from source you need Java and Apache ant and simply running
`ant` in the project root will build the zip-file. Building minimizes
CSS and JavaScript sources.

## Copyrights and license information

Tiny WebTex is released and licensed by a MIT [license](./LICENCE.md).
In other words, do as you please with it, but don't think you can hold us
liable for any damage caused to or by you if you use it.

A copy of yuilibrary is included to minify JavaScript and CSS.
Copyright (C) 2012 Yahoo! Inc. All rights reserved.
http://yuilibrary.com/license/
