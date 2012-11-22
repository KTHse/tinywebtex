Tiny WebTex
-----------

A plugin to edit and render (LaTeX) mathematic expressions with WebTex 
for the open source WYSIWYG JavaScript editor TinyMCE (http://www.tinymce.com/).


## Where to get it

Tinywebtex is as of this writing published at http://github.com/KTHse/tinywebtex


## Install

### Prerequisites

You need a WebTex backend service version 1.3.2 or later, see
http://github.com/fjollberg/webtex

### Installation instructions

Fetch a compiled release from the download directory or build from source,
see below. Unzip the package and copy the tinywebtex directory to the
TinyMCE plugin folder.

Register the `tinywebtex` plugin in the call to `tinyMCE.init`, as you
would with any other TinyMCE plugin, and add the `tinywebtex` button
to the toolbar. See the TinyMCE customization documentation for
details.

To get the base-lining functionality of WebTex into TinyMCE you need to add
the contents of the webtex.css style sheet from the WebTex package into
the style sheet loaded as content_css in tinyMCE.init.

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
    WEBTEX_MAX_LEN = 1900;  // Max length of encoded TeX expression before warning.
</script>
```

`WEBTEX_URL = "/webtex"` A string pointing to the base URL of the WebTex Service.
Typically, this have to be on the same host (and port) in order to avoid 
cross-site-scripting (XSS) issues.

There are a number of options for proxying the WebTex application into
the same namespace as the site using TinyMCE to avoid XSS if you use Apache httpd,
like mod_jk or mod_proxy, see the Apache documentation for details. There should
be similar possibilities for other web servers. Another option in some circumstances
may be to set the property document.domain which is supported in all modern browsers, 
https://developer.mozilla.org/en-US/docs/DOM/document.domain.

`WEBTEX_SIZE = 1` The default WebTex image size (the 'D' parameter to the service).

`WEBTEX_MAX_LEN = 1900` The max length of the encoded TeX expression before the
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


## Development

This project uses git and git flow style branching. Hence, the master branch is the 
stable release branch, and development is done on the development branch. For more 
information about the branch model see http://nvie.com/posts/a-successful-git-branching-model/.
For the `git flow` command line tool, see https://github.com/nvie/gitflow.

Version numbering follows the [Semantic versioning](http://semver.org) approach.


## Browser compatibility

Browsers are as they are and I've only tested the browsers I have reasonably
easy access to. Others may work or not.

### Browsers known to work

Tiny WebTex is as of this writing generally believed to work on:

* Opera >= 10
* Firefox >= 11
* Chrome >= 14
* Safari >= 5.1

More specifically these versions are known to work:

* Mac OS X Mountain Lion: Chrome 23, Firefox 16, Opera 12 and Safari 6.
* Windows 7: Chrome 23, Firefox 16 and Internet Explorer 9.
* Linux Fedora 17: Chrome 23 and Firefox 16.
* iOS 6: Safari 6 and Dolphin 6.
* Android: The tinywebtex plugin is known to work in the browser in
  Android 2.5.3 (HTC Sense 3.0) even if TinyMCE does not work completely.
  Later browsers as of Android 3 or something like that should work.

### Browsers currently known not to work

* Firefox <= 10 - problems fetching image, returns undefined. Seems ok otherwise.
* Internet Explorer <= 8 - initialization and menues issues.
* Safari <= 5.0 - cannot fetch image. Seems ok otherwise.


## Copyrights and license information

Tiny WebTex is released and licensed by a MIT [license](LICENCE.md).
In other words, do as you please with it, but don't think you can hold us
liable for any damage caused to or by you if you use it.

A copy of yuicompressor is included to minify JavaScript and CSS.
Copyright (C) 2012 Yahoo! Inc. All rights reserved.
http://yuilibrary.com/license/
