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

		// HACK: Get the actual client width when there is no image, and use this as
		// maximum width. Setting it beforehand was too tricky.
		let extRect = document.body.getBoundingClientRect();
		document.body.style.width = extRect.width.toString() + 'px';

		// The maximum extension dimensions are 800px by 600px. So we want the image
		// area to not make the whole extension larger than 600px tall, otherwise
		// unsightly scroll bars will appear.
		document.getElementById("displayarea").style.maxHeight = (600 - extRect.height).toString() + 'px';

    // Populate the selectors from server
    let font = document.getElementById("font");
		$(document).ready(function() {
        let font_selector = $('#font');
				let dpi = $('#DPI');
				let format = $('#format');

        dpi.empty();
        font_selector.empty();

        $.getJSON(server + "params", function (data) {
						// Fonts
            font_data = data["fonts"];
            $.each(font_data, function (key, entry) {
                font_selector.append(
                    $('<option></option>').attr('value', key).text(entry.description)
                );
            });
            persistentOptions("font");
            document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];

						// DPI
						let dpi_data = data["dpis"];
            $.each(dpi_data["options"], function (key, entry) {
                dpi.append(
                    $('<option></option>').attr('value', key).text(entry)
                );
            });
						dpi.val(dpi_data["default"]);
						persistentOptions("DPI");

						// Formats
						let format_data = data["formats"];
						$.each(format_data["options"], function (key, entry) {
                format.append(
                    $('<option></option>').attr('value', key).text(entry)
                );
            });
						format.val(format_data["default"]);
						persistentOptions("format");

						// Displaystyle
						document.getElementById("displaystyle").checked = data["displaystyle"];
						persistentOptions("displaystyle");
        }).fail(function() {
						alert('TeX Math Here: popup.js: Cannot contact compilation server. Please try again later.');
						Window.close();
				});
    });

    // Update the font dynamic name whenever the font selection changes.
    font.addEventListener("input", function(){
        document.getElementById("fontLabel").innerHTML = font_data[font.value]["formal"];
    });

    // Keep option values/selections persistent after extension closes
    function persistentOptions(selectID) {
        var input = document.getElementById(selectID);
        input.addEventListener('change', function () {
            localStorage.setItem(selectID, (selectID == "displaystyle") ? input.checked : input.value);
        });

        if(localStorage.getItem(selectID)) {
            var val = localStorage.getItem(selectID);
            if (selectID == "color") {
                input.jscolor.fromString(val);
            } else if (selectID == "displaystyle") {
								input.checked = (val == "true");
						} else {
                input.value = val;
						}
        }
    }

    persistentOptions("color");
		persistentOptions("code");

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
				let displaystyle = document.getElementById('displaystyle');
				let format = document.getElementById('format');

        latex = encodeURIComponent(latex.replace(/\//g, '\\slash').replace(/\n/g, "").replace(/\$/g, "").replace(/\\\[/g, ""));

        // Set URL using configuration options
        let dataString = "?d=" + DPI.value +
            "&c=" + colour.value +
            "&f=" + font.value +
						"&m=" + displaystyle.checked +
						"&t=" + format.value;

        let value = server + 'image/' + latex + dataString;
        var xhr = new XMLHttpRequest();

				if (!!document.getElementById('output')) {
						document.getElementById('output').remove();
				}

				document.getElementById("loader").style.display = "block";

        xhr.onreadystatechange = function () {
						// TODO: When the server processes and parses the code, thus filtering out any bad input,
						// set the internal code text to what's returned. We want the filtering to be done server-side.

            if (xhr.readyState == 4) {
								if (xhr.status == 200) {
										// Get image from URL and copy to clipboard
										if (format.value == "png" || format.value == "svg" || format.value == "gif") {
												var img = document.createElement('img');
												img.onload = function () {
														document.getElementById("loader").style.display = "none";
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
												};

												img.className = 'math';
												img.id = 'output';
												img.src = value;
										} else if (format.value == "mml" || format.value == "speech") {
												document.getElementById("loader").style.display = "none";
												var par = document.createElement('p');
												par.textContent = xhr.responseText;
												par.id = 'output';
												document.getElementById('displayarea').appendChild(par);
										} else {
												alert("TeX Math Here: popup.js: Unknown response format type: " + format.value);
										}
								} else if (xhr.status == 500) {
										document.getElementById("loader").style.display = "none";
										alert("TeX Math Here: popup.js: The given LaTeX code could not be compiled.\n" + JSON.parse(xhr.responseText)['message']);
								} else {
										document.getElementById("loader").style.display = "none";
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
