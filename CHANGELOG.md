# [4.5.0](https://github.com/CodeverDotDev/codever/compare/4.4.0...4.5.0) (2021-07-09)


### Bug Fixes

* **fe-bookmarks-delete:** when delete from bookmarks search results force page reload ([eb44c04](https://github.com/CodeverDotDev/codever/commit/eb44c04a4550ca5cd2aabf3ce57c5eafe24615c8))


### Features

* **search-history:** can delete history from search history for bigger screens ([1e650a5](https://github.com/CodeverDotDev/codever/commit/1e650a54342077e7df5354d46a2414a0abca4027))



# [3.0.0](https://github.com/CodeverDotDev/codever/compare/2.9.0...3.0.0) (2021-03-27)


### Bug Fixes

* **fe:** correct typo in menu entry in navigation.component.html ([4ffcc33](https://github.com/CodeverDotDev/codever/commit/4ffcc338a7ff67ead50efe35378aede1f3ad4909))
* **fe:** select right tab when navigation to my tags in user dashboard ([351618a](https://github.com/CodeverDotDev/codever/commit/351618a736bb35c79bc97919650c123a041a2fed))


### feature

* **codelets:** rename codelets to snippets everywhere ([dc8ef03](https://github.com/CodeverDotDev/codever/commit/dc8ef034f1ff95b71c1f9ee7b177a34088ea5c99))


### Features

* **search:** display in search bar also recent searches extra to saved searches ([421c6d7](https://github.com/CodeverDotDev/codever/commit/421c6d7a051e8a3b908a59f7e521ef2b133b67d6))
* **snippets:** Add public tagged page for snippets ([d0b23c3](https://github.com/CodeverDotDev/codever/commit/d0b23c382ac3b9649bbcf1b93b2fbf5e7e7f700d))


### BREAKING CHANGES

* **codelets:** the api paths are also changing ("snippets" instead of "codelets")



# [2.11.0](https://github.com/CodeverDotDev/codever/compare/2.9.0...2.11.0) (2021-03-06)


### Bug Fixes

* **fe:** select right tab when navigation to my tags in user dashboard ([351618a](https://github.com/CodeverDotDev/codever/commit/351618a736bb35c79bc97919650c123a041a2fed))


### Features

* **search:** display in search bar also recent searches extra to saved searches ([421c6d7](https://github.com/CodeverDotDev/codever/commit/421c6d7a051e8a3b908a59f7e521ef2b133b67d6))
* **snippets:** Add public tagged page for snippets ([d0b23c3](https://github.com/CodeverDotDev/codever/commit/d0b23c382ac3b9649bbcf1b93b2fbf5e7e7f700d))



# [2.9.0](https://github.com/CodeverDotDev/codever/compare/2.8.0...2.9.0) (2021-01-26)


### Features

* **public-snippets-page:** public snippets page and my-snippets page in dashboard ([9f6ca7b](https://github.com/CodeverDotDev/codever/commit/9f6ca7bfe3d16afdf5ed9e292db2785b6cdfbf3f))



# [2.7.0](https://github.com/CodeverDotDev/codever/compare/2.6.0...2.7.0) (2020-11-17)


### Features

* **fe:** add filter to hot-keys dialog and non-search results ([da6571d](https://github.com/CodeverDotDev/codever/commit/da6571d53d81f1afb4d1d9c71529b964af9e1ae2))



# [2.6.0](https://github.com/CodeverDotDev/codever/compare/2.5.0...2.6.0) (2020-11-15)


### Features

* **fe:** add popext option parameter when creating bookmark ([6ed31fc](https://github.com/CodeverDotDev/codever/commit/6ed31fcd9f2c22195347bfd0563a828de41c71e0))
* **fe:** always return fresh "history" ([74bae96](https://github.com/CodeverDotDev/codever/commit/74bae96964bfcf1339339dfe753d7bfec57e64a6))
* **fe:** extract add to history to new service ([521fd64](https://github.com/CodeverDotDev/codever/commit/521fd640cf59ea75274d8629650a09aa1098f59b))
* **fe:** show more entries (20) in history dialog and make it scrollable ([a9500be](https://github.com/CodeverDotDev/codever/commit/a9500be781c36089319fbce4a63cbb2d3058c47c))



# [2.5.0](https://github.com/CodeverDotDev/codever/compare/2.4.0...2.5.0) (2020-10-23)

### Change snippets to (code) snippets only visually 


# [2.4.0](https://github.com/CodeverDotDev/codever/compare/2.3.1...2.4.0) (2020-08-25)

### Performance Improvements

* **mongo:** add index on createdAt for bookmarks ([83388b4](https://github.com/CodeverDotDev/codever/commit/83388b451410f0fe6ea8f91d7dab95908470d291))
* **mongo:** add index on tags for bookmarks ([9f20cd9](https://github.com/CodeverDotDev/codever/commit/9f20cd9b925d7b03f6f638c9f2d60dfc9d0884ca))
* **update-user-data:** improve datat transfer when clicking links and bei pinned and read later ([2f2b72b](https://github.com/CodeverDotDev/codever/commit/2f2b72ba5bf1490c6eb143df0bdfb88e08267a9c))



## [2.3.2](https://github.com/CodeverDotDev/codever/compare/2.3.1...2.3.2) (2020-08-07)


### Bug Fixes

* **fe-searchbox:** close autocomplete panel when hitting ENTER ([f0a7d39](https://github.com/CodeverDotDev/codever/commit/f0a7d3944c3eb312e9ff53501c90994caf74ab58))



## [2.3.1](https://github.com/CodeverDotDev/codever/compare/2.3.0...2.3.1) (2020-08-06)


### Bug Fixes

* **fe:** trigger search when click on lupe in search bar ([0fc7cd4](https://github.com/CodeverDotDev/codever/commit/0fc7cd45c9d1496042d2ced7866b00e4622192f5))



# [2.3.0](https://github.com/CodeverDotDev/codever/compare/2.2.0...2.3.0) (2020-08-06)


### Features

* **fe:** show search domain as text for bigger screens (>1400 currently) ([709ae64](https://github.com/CodeverDotDev/codever/commit/709ae64942269dad74a402030bde7a97e0fac16a))



# [2.2.0](https://github.com/CodeverDotDev/codever/compare/2.1.0...2.2.0) (2020-08-04)


### Features

* **recent-searches:** add recent searches to user dashboard ([4c257e3](https://github.com/CodeverDotDev/codever/commit/4c257e3ac2163c32445a07dd82ba7c48a41249f0))



# [2.1.0](https://github.com/CodeverDotDev/codever/compare/2.0.4...2.1.0) (2020-08-02)


### Bug Fixes

* remove unused pipe in snippet-details.component.html ([8f94094](https://github.com/CodeverDotDev/codever/commit/8f9409432829d2cc4a53544766714ff359fc3304))


### Features

* **fe:** add "ctrl+s" hot key to focus on the searchbox ([7129921](https://github.com/CodeverDotDev/codever/commit/712992148ef378514f2255bffe7d6dc50d107c84))
* **fe:** introduce side navigation ([39dcfbc](https://github.com/CodeverDotDev/codever/commit/39dcfbcd6a6cfbf01b4c358ce824b8bf12fadba4))



## [2.0.4](https://github.com/CodeverDotDev/codever/compare/1.0.0...2.0.4) (2020-07-18)


### Bug Fixes

* **fe:** more distances between saved searches in my dashboard ([684c7be](https://github.com/CodeverDotDev/codever/commit/684c7be9963a3aeefd5de7a05ce143436d959553))
* **fe:** overflow bootrap dropdown menu in angular expansion panel ([c996aec](https://github.com/CodeverDotDev/codever/commit/c996aec0d3377ebabfc17ded70bbbeecc781e350))
* **fe-snippets:** avoid double adding snippets tags reloaded ([52285dc](https://github.com/CodeverDotDev/codever/commit/52285dcdae3305729890b8cacf2b4fe70fc5efce))
* **fe-snippets:** avoid double adding of chip and text when selecting chip ([ef06639](https://github.com/CodeverDotDev/codever/commit/ef06639cb97d4f1a300d46fd53fdd13f2247ed48))


### Features

* **fe:** update to angular 10 ([ceb5514](https://github.com/CodeverDotDev/codever/commit/ceb5514fd84c27c28b0930cdd8bd678f3685595f))


### BREAKING CHANGES

* **fe:** update both angular and angular material to version 10



## [1.0.1](https://github.com/CodeverDotDev/codever/compare/1.0.0...1.0.1) (2020-07-12)


### Bug Fixes

* **fe-snippets:** avoid double adding of chip and text when selecting chip ([ef06639](https://github.com/CodeverDotDev/codever/commit/ef06639cb97d4f1a300d46fd53fdd13f2247ed48))



# [1.0.0](https://github.com/CodeverDotDev/codever/compare/13.0.0...1.0.0) (2020-07-10)


### Bug Fixes

* **be:** correct page in pagination when count is zero ([5642ddc](https://github.com/CodeverDotDev/codever/commit/5642ddc27a3aafd55657f4eadb59b07da6a948af))
* **be:** make youtube tags lowercase ([4d9911f](https://github.com/CodeverDotDev/codever/commit/4d9911f8667d6c807ee65122e463825a4a1ef6d8))
* **be-trust-proxy:** set trust proxy in app.js ([e594c18](https://github.com/CodeverDotDev/codever/commit/e594c18c2e9f255034097504dd775dd88f66b87d))
* **fe:** avoid double adding of chip and text when selecting chip ([53da1e4](https://github.com/CodeverDotDev/codever/commit/53da1e4368574726202d4e76f729c99ff7a39b30))
* **fe:** correct edit url in save-bookmark-form.component.ts ([98eabce](https://github.com/CodeverDotDev/codever/commit/98eabce450ae972bcfd29a116558442e445bff4a))
* **fe:** display only first 150 chars of url in history popup ([74179d7](https://github.com/CodeverDotDev/codever/commit/74179d7bad1b32141072ffbd4591e1174937a3d1))
* **fe:** make variable public to build for aot ([b746705](https://github.com/CodeverDotDev/codever/commit/b746705f45267e1f279b8355750e6ed334534b6c))
* **fe:** remove alert when clicking on link in description ([5e275ef](https://github.com/CodeverDotDev/codever/commit/5e275efefbe3ffd5fb22350b47df531f4c321b3f))
* **github-link:** make github links point to the new CodeverDotDev org ([9c2bdfa](https://github.com/CodeverDotDev/codever/commit/9c2bdfa98f2018a2ecc30023293c0da41955f1d6))
* **location-exists:** encode the whole url to make sure "+" signs don't get removed ([7dcbdb9](https://github.com/CodeverDotDev/codever/commit/7dcbdb99001379666b5fd0fdb0020af23c60141d))
* **mongo:** search domain for saved searches ([e04c58b](https://github.com/CodeverDotDev/codever/commit/e04c58b5ef63ad9d00b459914331a082f6454f77))
* **saved-searches-page:** add saved searches for my-snippets ([8f8e3b9](https://github.com/CodeverDotDev/codever/commit/8f8e3b9cae9ccdaf00327eb5535132e188d4cd0b))


### Features

* **be-add-helmet:** add some protective headers to backend ([93de3ad](https://github.com/CodeverDotDev/codever/commit/93de3ad34b4d28d2269e9d2c6d7a51207afd03a8))
* **dashboard-my-tags:** add expansian panels to make it clappable ([369f7eb](https://github.com/CodeverDotDev/codever/commit/369f7eb2ee5a4301337b1d38a0d91adec535f61e))
* **fe:** add shadow between cards and increase distance ([72b140f](https://github.com/CodeverDotDev/codever/commit/72b140f867ebacc9d8d2d49920d3f56820a92e20))
* **fe:** add to pinned after creation possibility ([19d25c5](https://github.com/CodeverDotDev/codever/commit/19d25c5fb9971af732d3231f651c6ad6b8540a8e))
* **fe:** show language only for public bookmarks ([8b0bdab](https://github.com/CodeverDotDev/codever/commit/8b0bdab547baf61c59697a440b8590a2da98a7ac))
* **fe:** visually enhance selection of search domain ([4ac5c03](https://github.com/CodeverDotDev/codever/commit/4ac5c03a5d368be973486f2a4360b4e113e9a36c))
* **fe-bookmark-details:** works initially except feed pagination... ([56d2dba](https://github.com/CodeverDotDev/codever/commit/56d2dbadf76aba34bb3ee592c360ef0ae9090a08))
* **fe-hot-keys:** add hot keys dialog (ctrl+h for history) and (ctrl+p for pinned) ([0fd93a2](https://github.com/CodeverDotDev/codever/commit/0fd93a24344fbbbe526e803854d2336bb554912b))
* **fe-hot-keys:** add hot keys dialog (ctrl+h for history) and (ctrl+p for pinned) ([6ed1796](https://github.com/CodeverDotDev/codever/commit/6ed1796c07cebd535c09460371a393f41026c72d))
* **fe-save-bookmark-form:** add edit possibility when bookmark already present ([edf5caf](https://github.com/CodeverDotDev/codever/commit/edf5cafdea101a842a1c8d309e119a7163c84003))
* **fe-share-bookmark:** add possibility to share bookmark link via email ([e0a6210](https://github.com/CodeverDotDev/codever/commit/e0a6210b71126a9fecc38933807dcb23001cb4a2))
* **history-mgt:** add to history when link inside description clicked ([74cc43a](https://github.com/CodeverDotDev/codever/commit/74cc43a6dc0b22ca7f2272b9ab5c663b841fa8e5))
* **saving-snippets:** add tags and comment as input strings via query params ([ea1f819](https://github.com/CodeverDotDev/codever/commit/ea1f819429e0e0b44965a528de93843863850e90))


### Performance Improvements

* **fe:** update to angular 9 ([715c891](https://github.com/CodeverDotDev/codever/commit/715c8910a3b13faa21f3eba7ea79febf642d69d6))




