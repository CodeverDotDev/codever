Codever Browser Extension
---
Browser extension to easily save bookmarks, code snippets or notes from the web to [www.codever.dev](https://www.codever.dev),
 the Bookmarks, Snippets and Notes Manager for Developers & Co.
 
## Install
This browser extension is available for:

| [![Chrome](assets/img/chrome-logo-48.png)](https://chrome.google.com/webstore/detail/codever/diofdblfhjbpgackifolmboaiccmebjb) | [![Chrome](assets/img/firefox-logo-48.png)](https://addons.mozilla.org/addon/codever/) 
|:---:|:---:|
| [Chrome](https://chrome.google.com/webstore/detail/codever/diofdblfhjbpgackifolmboaiccmebjb)| [Firefox](https://addons.mozilla.org/addon/codever/) 

> If you can't use Browser Extensions, or you have a tight security blocking pop-up windows from extensions 
> (**Firefox blocks new windows from pages by default**) you can use [our bookmarklet](https://www.codever.dev/howto/bookmarklet)
> which offer the same functionality 

## How to use  

**Right click** OR **click the extension icon** to save as bookmark, snippet or note to [Codever](https://www.codever.dev)
- if you make a selection on the web page you will be asked to save as new **snippet**, **bookmark** or **note**
- when bookmarking youtube videos and stackoverflow questions the **tags** are auto-completed

### Save bookmark

![Save bookmark demo](assets/img/gif/codever-save-bookmarks-800x454.gif)

### Save snippet

![Save snippet demo](assets/img/gif/codever-save-snippet-800x454.gif)


## Testing locally

Check out the git repository - `git clone https://github.com/CodeverDotDev/codever-browser-extension.git`

## Chrome/Brave
Go to [chrome://extensions/](chrome://extensions/), click **Load unpacked** and select the `codever-browser-extension`
where you have checked it out:

![Install locally](assets/img/chrome-install-locally-and-reload-extension.png)

> Click "Reload" on the extension when you do modifications 

### Firefox

#### Use [web-ext](https://github.com/mozilla/web-ext)
The easiest way is to use [web-ext](https://github.com/mozilla/web-ext)
 You can install it globally for example via

```
npm install --global web-ext
```

and then run the following command in the root directory of the project

```
web-ext run
```

This installs **Codever** as a temporary add-on, and it watches for changes in the source code
and **redeploys automatically**.

#### Manual deployment

Go to [about:debugging#/runtime/this-firefox](about:debugging#/runtime/this-firefox), click **Load Temporary Add-on...**
 and select the `manifest.json` file from the `save-code-to-bookmarks.dev-browser-extension` folder where you have checked it out:

![Install locally on Firefox](assets/img/chrome-install-locally-and-reload-extension.png)

### Test the extension against the [`localhost`](https://github.com/CodeverDotDev/codever) version of Codever

Change the following line in [launch-codever-dialog.js](launch-codever-dialog.js):
```
open('https://www.codever.dev/new-entry?url=' + encodeURIComponent(l) + '&desc=' + encodeURIComponent(d) + '&title=' + encodeURIComponent(t) + '&popup=true', 'Codever.dev', features);
```
to
```
open('http://localhost:4200/personal/new?url=' + encodeURIComponent(l) + '&desc=' + encodeURIComponent(d) + '&title=' + encodeURIComponent(t) + '&popup=true', 'Codever.dev', features);
```

and Reload the extension 

## Publish browser extension to official stores

First of all zip the file either with `web-ext`

```
web-ext build -i 'resources' 'assets' 'README.md' 'CHANGELOG.md'

## with overwrite 
web-ext build --overwrite-dest -i 'resources' 'assets' 'README.md' 'CHANGELOG.md' 
```

or with the _standard_ `zip` command:

```shell
zip -r codever.browser.extension-4.0.0.zip * -x *.idea* *.git* '*resources/*' '*assets/*' "*README.md*" "*CHANGELOG.md*" '*web-ext-artifacts/*'
```

### Publish to Google Chrome Webstore

Go to [Chrome Webstore Dashboard](https://chrome.google.com/webstore/developer/dashboard) where
you upload the .zip file. Wait for a couple of business days for an approval.

### Publish to [Firefox Webstore](https://extensionworkshop.com/documentation/publish/)

Go to [Add-ons page](https://addons.mozilla.org/en-US/developers/addons) and submit the new addon
