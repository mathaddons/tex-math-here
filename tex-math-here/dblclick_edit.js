// dblclick_edit.js -- CONTENT SCRIPT THAT LOADS WITH EVERY SPECIFIED WEBPAGE AND ENABLES DOUBLE CLICK EDIT FUNCTIONALITY

document.addEventListener('dblclick', function(e) {
        e = e || window.event;

        let gDocsRegEx = /docs\.google\.com\/document/;                 // MATCHES TO GOOGLE DOCS
        let gSlidesRegEx = /docs\.google\.com\/presentation/;           // MATCHES TO GOOGLE SLIDES

        let address = location.href;            // STORES PAGE URL
        let dataGrabbed = false;                // INDICATES IF LATEX METADATA WAS RETRIEVED
        let latex_meta = "";                    // STORES LATEX METADATA

        // DETERMINE CURRENT DOMAIN OF IMAGE
        if (gDocsRegEx.test(address))    // IF IN GOOGLE DOCS
        {
                // ONLY RUN IF TAG <image> WAS CLICKED ON
                if (e.target.nodeName.toLowerCase() === "image")
                {
                        // GETS THE SPECIFIC LINK FOR THE CLICKED IMAGE FOR MATCHING AGAINST THE OTHER IMAGE NODES
                        let image_link = e.target.getAttribute('xlink:href') || e.target.getAttribute('href');

                        // SEARCH THE LIST OF IMAGES UNTIL ONE WITH A MATCHING LINK IS FOUND THAT ALSO HAS THE METADATA
                        let imageList = document.getElementsByTagName('image');
                        let imageListLength = imageList.length;

                        // LOOPS THROUGH IMAGE LIST
                        for (let i = 0; i < imageListLength; i++)
                        {
                                // IF IMAGE TAG HAS SAME LINK
                                if ((imageList[i].getAttribute('xlink:href') === image_link) || (imageList[i].getAttribute('href') === image_link))
                                {
                                        // IF THE IMAGE ACTUALLY HAS TEXT IN THE <title> TAG -- AKA THE LATEX METADATA
                                        if (!!imageList[i].getElementsByTagName('title')[0].textContent)
                                        {
                                                latex_meta = imageList[i].getElementsByTagName('title')[0].textContent;
                                                dataGrabbed = true;
                                                break;    // GOT THE METADATA, NOW GET OUTTA THERE! :)
                                        }
                                }
                        }
                }
        }
        else if (gSlidesRegEx.test(address))    // IF IN GOOGLE SLIDES
        {
                // ONLY RUN IF TAG <image> WAS CLICKED ON
                if (e.target.nodeName.toLowerCase() === 'image')
                {
                        let nodeCur = e.target;         // CURRENT NODE
                        let idRegEx = /^editor-/;       // MATCHES TO TEXT AT START OF IMAGE ID
                        let imageID = "";               // STORES IMAGE ID

                        // TRAVERSES NODE TREE TO FIND IMAGE ID
                        do {
                                nodeCur = nodeCur.parentNode;    // STARTING NODE NOW HAS TAG OF <g> INSTEAD OF <image>

                                // IF ID MATCHES PATTERN
                                if (idRegEx.test(nodeCur.id))
                                {
                                        imageID = nodeCur.id;
                                        imageID = imageID.slice(7);   // ISOLATE THE PURE ID FROM THE STRING -- REMOVES 'editor-'
                                        break;    // EXIT LOOP IF ID FOUND
                                }
                        } while (nodeCur.nodeName.toLowerCase() === 'g')    // PREVENTS ENDLESS LOOP -- ITERATIVELY FOLLOWS <g> PARENT NODES OF IMAGE

                        // CODE TO TAKE ID AND FIND META DATA

                        let scriptArray = document.getElementsByTagName('script');              // AN ARRAY OF ALL <script> ELEMENTS IN THE DOCUMENT
                        let docModelChunkRegEx = /^DOCS_modelChunk =/;                          // MATCHES TO STRINGS THAT CONTAIN THE LAYOUT OF EACH POWERPOINT SLIDE
                        let imageIdRegEx = new RegExp(imageID);                                 // MATCHES TO THE PREVIOUSLY ISOLATED IMAGE ID

                        // MATCHES TO:  imageID","latex_title_meta_data","  |--> while isolating the latex_title_meta_data when run with the exec() function
                        // THE latex_title_meta_data CAN CONTAIN EITHER A STRING OF CHARACTERS THAT CAN BE ANY CHARACTER EXCEPT A DOUBLE QUOTE " OR IT CAN BE A STRING OF CHARACTERS INCLUDING DOUBLE QUOTES AS LONG AS EACH DOUBLE QUOTE IS PRECEDED BY A BACKSLASH \"
                        // BASICALLY LIMITING THE SELECTION TO THAT SPECIFIC STRING
                        // BACKSLASHES MUST BE ESCAPED IN BOTH THE STRING REPRESENTING THE REGEX AND THE REGEX ITSELF, HENCE \\\\" TO REPRESENT A REGEX MATCHING \"
                        let imageTitleLatexRegEx = new RegExp(imageID + '","(([^"]*)|([^"]*\\\\"[^"]*)*)","');
                        let scriptContents = "";                                                // CONTAINS THE CONTENTS OF <script> TAGS
                        let results = "";                                                       // CONTAINS AN ARRAY OF RESULTS FROM EXECUTING RegExp.prototype.exec()
                        let raw_latex_meta = "";                                                // HOLDS THE UNPROCESSED METADATA

                        // CATCHES ANY EXCEPTIONS THROWN DUE TO USERS DOUBLE CLICKING ON IMAGES NOT FROM TEX MATH HERE
                        try {
                                // LOOPS THROUGH EACH ELEMENT OF THE <script> ARRAY
                                for (let script of scriptArray)
                                {
                                        scriptContents = script.textContent;

                                        // IF <script> CONTAINS SLIDE DATA AND CONTAINS THE IMAGE ID -- SHOULD MATCH TO ONLY ONE SLIDE
                                        if (docModelChunkRegEx.test(scriptContents) && imageIdRegEx.test(scriptContents))
                                        {
                                                results = imageTitleLatexRegEx.exec(scriptContents);    // MATCHES TO THE LOCATION/STRING OF THE TITLE (LaTeX) METADATA FOR THE IMAGE AND RETURNS AN ARRAY OF RESULTS

                                                raw_latex_meta = results[1];                            // SAVES THE TITLE (LaTeX) METADATA WHICH WAS ISOLATED BECAUSE OF THE (([^"]*)|([^"]*\\\\"[^"]*)*) IN THE ABOVE REGULAR EXPRESSION
                                                latex_meta = eval("'" + raw_latex_meta + "'");          // PROCESSES THE RAW INPUT AND REMOVES EXTRA BACKSLASHES, INTERPRETS UNICODE CHAR CODES (\u0026), ETC.

                                                dataGrabbed = true;
                                                break;    // THE METADATA IS ISOLATED AND READY TO BE SENT
                                        }
                                }

                                // NEW OR COPIED IMAGES AND THE ASSOCIATED METADATA ARE NOT REPRESENTED IN THE DATA STRUCTURE BEING SEARCHED (THE DOCS_modelChunks) UNTIL THE PAGE IS RELOADED
                                if (dataGrabbed == false)
                                {
                                        alert('In Google Slides, for newly created or copied TeX Math Here images, the page needs to be refreshed once before any of those new or copied images can be edited.\nPlease refresh the page and try again. Thank you.');
                                }
                        } catch (e) {
                                console.error('TeX Math Here: dblclick_edit.js: The image clicked does not have metadata and is most likely not a TeX Math Here image.');
                        }
                }
        }

        // CODE TO GET THE LATEX BACK INTO THE EXTENSION
        if (dataGrabbed)
        {
                let Browser;
                // DETECT BROWSER TYPE FOR PROPER API USE
                try {
                        // FOR FIREFOX
                        Browser = browser;
                } catch(e) {
                        try {
                                // FOR CHROME
                                Browser = chrome;
                        } catch(e) {
                                console.error('TeX Math Here: dblclick_edit.js: ERROR BROWSER TYPE NOT DETECTED!');
                        }
                }

                // SEND LATEX TO BACKGROUND SCRIPT FOR STORAGE UNTIL POPUP IS OPENED
                Browser.runtime.sendMessage({ type: 'latex_store', latex: latex_meta });
                alert('Any embedded TeX in the image can now be found in the TeX Math Here TeX editor.');
        }
});
