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

You have to declare the variable WEBTEX_URL before the TinyMCE initalization
and point it to the base URL for the WebTex service. Typically, this have
to be on the same host (and port) in order to avoid cross-site-scripting (XSS) issues.

```
<script type="text/javascript">
    WEBTEX_URL = '/webtex';
</script>
```

There are a number of options for proxying the WebTex application into
the same namespace as the site using TinyMCE to avoid XSS if you use Apache httpd,
like mod_jk or mod_proxy, see the Apache documentation for details. There should
be similar possibilities for other web servers.

The source-files (*_src.css and *_src.js) are included in the package and can be
used for debugging purposes. However, without modification only the minimized 
versions of these files are used and the source versions can be deleted.

## Build from source

To "build" from source you need Java and Apache ant and simply running
`ant` in the project root will build the zip-file. Building minimizes
CSS and JavaScript sources.

## Copyrights and license information

Tiny WebTex is released and licensed by a MIT [license](./LICENCE.md).
In other words, do as you please with it, but don't think you can hold us
liable for any damage caused to or by you if you use it.
