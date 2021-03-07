document.addEventListener('DOMContentLoaded', function () {
    let Browser;
    let server = "http://engine.mathaddons.com/";
		// let server = "http://localhost:5000/"; //
    var font_data;

    try {
        // Firefox
        Browser = browser;
    } catch(e) {
        try {
            // Chrome and Edge
            Browser = chrome;
        } catch(e) {
            console.error('TeX Math Here: popup.js: Unknown browser type.');
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
            });
            persistentOptions("font");
            document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];
        }).fail(function() { alert('TeX Math Here: popup.js: Cannot contact compilation server. Please try again later.'); });
    });

    // Update the font dynamic name whenever the font selection changes.
    font.addEventListener("input", function(){
        document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];
    });

    // Keep option values/selections persistent after extension closes
    function persistentOptions(selectID) {
        var input = document.getElementById(selectID);
        input.addEventListener('change', function () {
            localStorage.setItem(selectID, input.value);
        });
        if(localStorage.getItem(selectID)){
            var val = localStorage.getItem(selectID);
            if(selectID == "color"){
                input.jscolor.fromString(val);
            }
            else if(selectID == "font"){
                console.log(val);
                font.value = val;
            }
            else if(selectID == "DPI"){
                input.value = val;
            }
        }
    }

    persistentOptions("DPI");
    persistentOptions("color");

    var input = document.getElementById("code");

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

        latex = encodeURIComponent(latex.replace(/\//g, '\\slash').replace(/\n/g, "").replace(/\$/g, "").replace(/\\\[/g, ""));
        sessionStorage.clear();

        // Set URL using configuration options
        let dataString = "?d=" + DPI.value +
            "&c=" + colour.value +
            "&f=" + font.value;

        let value = server + 'image/' + latex + dataString;
        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
						// TODO: When the server processes and parses the code, thus filtering out any bad input,
						// set the internal code text to what's returned. We want the filtering to be done server-side.

            if (xhr.readyState == 4) {
								if (xhr.status == 200) {
										let imageExists = !!document.getElementById('latex_image');
										if (imageExists){
												document.getElementById('latex_image').remove();
										}

										// Get image from URL and copy to clipboard
										var img = document.createElement('img');
										img.className = 'math';
										img.id = 'latex_image';
										img.src = value;
										document.getElementById('displayarea').appendChild(img);

										img.alt = e.target.children.code.value;
										img.title = e.target.children.code.value;
										var range = document.createRange();
										range.selectNode(img);
										var sel = window.getSelection();

										// Clears the selection so that nothing but what it selects next is selected on copy.
										sel.removeAllRanges();
										sel.addRange(range);
										document.execCommand('Copy');
										sel.removeAllRanges();
								} else if (xhr.status == 500) {
										// TODO: Report the specific compliation error.
										alert("TeX Math Here: popup.js: The given LaTeX code could not be compiled.\n" + JSON.parse(xhr.responseText)['message']);
								} else {
										alert("TeX Math Here: popup.js: An internal server error has occurred. Please ensure the latest version of Tex Math Here is installed. If it is, try again in a few minutes or contact the extension developer to check on the server status.");
								}
						}

            xhr.timeout = 10000; // 10 seconds
            xhr.ontimeout = function (){
								alert("The request to the server has timed out. Please verify your computer's network connection.");
						};
				};

        xhr.open('GET', value, true);
        xhr.send();
    });

}, false);
