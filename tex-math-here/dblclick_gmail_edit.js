// dblclick_gmail_edit.js -- CONTENT SCRIPT THAT LOADS WITH GMAIL AND ENABLES DOUBLE CLICK EDIT FUNCTIONALITY

localStorage.setItem('prev_title', 'undefined');
localStorage.setItem('cur_title', 'undefined');

document.addEventListener('click', function(e) {
        e = e || window.event;

        // KEEPS TRACK OF PREVIOUS CLICK'S IMAGE TITLE FOR USE WITH DOUBLE CLICK LISTENER
        localStorage.setItem('prev_title', localStorage.getItem('cur_title'));

        // IF TAG <img> WAS CLICKED
        if (e.target.nodeName.toLowerCase() === "img")
        {
                if (e.target.title == null)
                {
                        localStorage.setItem('cur_title', 'undefined');
                }
                else
                {
                        localStorage.setItem('cur_title', e.target.title);
                }
        }
        else
        {
                localStorage.setItem('cur_title', 'undefined');
        }
});

document.addEventListener('dblclick', function(e) {
        e = e || window.event;

        let dataGrabbed = false;                // INDICATES IF LATEX METADATA WAS RETRIEVED
        let latex_meta = "";                    // STORES LATEX METADATA

        latex_meta = localStorage.getItem('prev_title');

        if (latex_meta != 'undefined')
        {
                dataGrabbed = true;
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
                                console.error('TeX Math Here: dblclick_gmail_edit.js: ERROR BROWSER TYPE NOT DETECTED!');
                        }
                }

                // SEND LATEX TO BACKGROUND SCRIPT FOR STORAGE UNTIL POPUP IS OPENED
                Browser.runtime.sendMessage({ type: 'latex_store', latex: latex_meta });
                alert('Any embedded TeX in the image can now be found in the TeX Math Here TeX editor.');
        }
});