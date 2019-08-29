// latex_transport.js -- BACKGROUND SCRIPT THAT SERVES AS A GO-BETWEEN FOR dblclick_edit.js and popup.js

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
                console.error('TeX Math Here: latex_transport.js: ERROR! BROWSER TYPE NOT DETECTED.');
        }
}

Browser.runtime.onMessage.addListener(function(message, sender, sendBack) {
        // DETERMINE WHAT ACTION TO TAKE
        switch (message.type)
        {
                case 'latex_store':
                        localStorage.setItem('latex', message.latex);
                        break;
                case 'latex_retrieve':
                        let latex_data;

                        // IF NOTHING IS STORED
                        if (localStorage.getItem('latex') == null)
                        {
                                latex_data = 'undefined';
                        }
                        else    // SOMETHING IS STORED
                        {
                                latex_data = localStorage.getItem('latex');
                                localStorage.removeItem('latex');
                        }

                        sendBack(latex_data);
                        break;
                default:
                        console.error('TeX Math Here: latex_transport.js: ERROR! UNKNOWN MESSAGE RECEIVED.');
        }
});
