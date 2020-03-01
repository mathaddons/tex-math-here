document.addEventListener('DOMContentLoaded', function () {
    let Browser;
    let server = "http://engine.mathaddons.com/";
    var font_data;

    try {
        // Firefox
        Browser = browser;
    } catch(e) {
        try {
            // Chrome
            Browser = chrome;

        } catch(e) {
            console.error('TeX Math Here: popup.js: ERROR BROWSER TYPE NOT DETECTED!');
        }
    }

    // Populate the font selector from server fonts
    let font = document.getElementById("font");
    $(document).ready(function() {
        let font_selector = $('#font');
        font_selector.empty();

        $.getJSON(server + "fonts", function (data) {
            font_data = data;
            $.each(data, function (key, entry) {
                font_selector.append(
                    $('<option></option>').attr('value', key).text(entry.description)
                );
            })
            persistentOptions("font");
            document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];
        }).fail(function() { alert('TeX Math Here: popup.js: Cannot contact compilation server. Please try again later.'); })
    })

    // Update the font dynamic name whenever the font selection changes.
    font.addEventListener("input", function(){
        document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];
    })

    // Keep option values/selections persistent after extension closes
    function persistentOptions(selectID) {
        var input = document.getElementById(selectID)
        input.addEventListener('change', function () {
            localStorage.setItem(selectID, input.value);
        });
        if(localStorage.getItem(selectID)){
            var val = localStorage.getItem(selectID);
            if(selectID == "color"){
                input.jscolor.fromString(val);
            }
            else if(selectID == "DPI"){
                input.value = val;
            }
        }
    }

    persistentOptions("DPI");
    persistentOptions("color");

    var input = document.getElementById("code");

    // Listens for a change of input in the text box
    input.addEventListener('input', function () {
        localStorage.setItem("text", input.value);

        function checkInput(text) {
            if (input.value.includes(text)) {
                // Alerted is set to "yes" if the alert has already
                //+ been shown for the key value, otherwise it is set to null
                // Session storage used so the value "yes" does not persist
                //+ if the extension is closed and then reopened
                let alerted = sessionStorage.getItem(text) || null;
                if(alerted != "yes") {
                    alert("The LaTeX " + text + " will be removed from the output.");
                    sessionStorage.setItem(text, "yes");
                }
            }
        }

        checkInput("\\include");
        checkInput("\\input");
        checkInput("\\newread");
        checkInput("\\newwrite");
        checkInput("\\openin");
        checkInput("\\openout");
        checkInput("\\closein");
        checkInput("\\closeout");
        checkInput("\\write18");
    });

    // SENDS MESSAGE TO latex_transport.js,
    // QUERYING IF DOUBLE CLICK EDIT HAS BEEN USED.
    // IF YES, DATA IS SENT BACK AND STORED IN retrieved_latex,
    Browser.runtime.sendMessage({ type: 'latex_retrieve' }, function(retrieved_latex) {
        // IF NO DOUBLE CLICK EDIT
        if (retrieved_latex == 'undefined'){
            // IF NO PREVIOUS CODE WAS ENTERED
            if (localStorage.getItem("text") != null){
                input.value = localStorage.getItem("text");
            }
        }
        else {   // DOUBLE CLICK EDIT WAS USED
            input.value = retrieved_latex;
            localStorage.setItem("text", retrieved_latex);
        }
        document.getElementById("code").select();
    });

    // LISTENS FOR KEY COMBO TO CONVERT IMAGE -- SEE BELOW
    document.body.addEventListener("keydown", function(e) {
        e = e || window.event;

        // Ctrl+Enter for Windows and Linux -- additional Command+Enter option for Mac
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
        {
            let focusElement = document.activeElement;

            // In case element in focus is a text box, blurs it so a strange
            // Firefox auto-copy bug doesn't occur.
            focusElement.blur();

            document.getElementById('submitButton').click();
            focusElement.focus();
        }
    });

    // Submit - occurs when the user presses the "Submit" button or Ctrl+Enter
    // Should copy image to clipboard
    let form = document.getElementById('form');
    form.addEventListener('submit', function (e){
        e.preventDefault();
        // Get values from user configuration
        let font = document.getElementById('font');
        let DPI = document.getElementById('DPI');
        let colour = document.getElementById('color');
        let latex = e.target.children.code.value;

        latex = encodeURIComponent(latex.replace(/\//g, '\\slash').replace(/\n/g, ''));
        sessionStorage.clear();

        // Set URL using configuration options
        let dataString = "?d=" + DPI.value +
            "&c=" + colour.value +
            "&f=" + font.value;

        let value = server + 'image/' + latex + dataString;
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            // If the server has responded
            if (xhr.readyState == 4) {
                let imageExists = !!document.getElementById('latex_image');
                if (imageExists){
                    document.getElementById('latex_image').remove();
                }

                // Get image from URL and copy to clipboard
                var img = document.createElement('img');
                img.id = 'latex_image';
                img.src = value;
                document.body.appendChild(img);
                img.alt = e.target.children.code.value;
                img.title = e.target.children.code.value;
                var r = document.createRange();
                //r.setStartBefore(img);
                //r.setEndAfter(img);
                r.selectNode(img);
                var sel = window.getSelection();

                 // CLEARS THE SELECTION SO THAT NOTHING BUT WHAT IT SELECTS NEXT IS SELECTED ON COPY
                sel.removeAllRanges();
                sel.addRange(r);
                document.execCommand('Copy');

                // CLEARS THE SELECTION SO THAT THE IMAGE DOESN'T LOOK BLUE AT THE END (AESTHETIC)
                sel.removeAllRanges();
            }

            if(xhr.readyState == 4 && xhr.status == 0 && Browser == chrome){
                alert("Please ensure the latest version of Tex Math Here is installed. If it is, try again in a few minutes.")
            }

            xhr.timeout = 10000; // 10 seconds

            // After 10 seconds have passed
            xhr.ontimeout = function (){
                //If the browser is Firefox and timeout has occurred
                if (Browser == browser){
                    alert("Please ensure the latest version of Tex Math Here is installed. If it is, try again in a few minutes.")
                }
            }
        }

        xhr.open('GET', value, true);
        xhr.send();
    });

    //This version opens a new tab with the image instead of copying to clipboard
    //Currently do not know how to have both options available, buttons were being weird if they didn't have the submit attribute attached
    //form.addEventListener('submit', function (e) {
    //    e.preventDefault();
    //    let value = 'http://latex.codecogs.com/gif.latex?' + e.target.children.code.value
    //    window.open(value, '_blank');
    //    console.log(code)
    //})

}, false);
