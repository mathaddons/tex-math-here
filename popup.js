document.addEventListener('DOMContentLoaded', function () {
    let Browser;
    let server = "http://engine.mathaddons.com";
		// let server = "http://localhost:5000"; //
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

        $.getJSON(server + "/params", function (data) {
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
		let inputs = [];
		function saveInputOptions (selectID, input) {
        localStorage.setItem(selectID, (selectID == "displaystyle") ? input.checked : input.value);
    }

    function persistentOptions(selectID) {
        var input = document.getElementById(selectID);
				inputs.push({"input": input, "selectid": selectID});

        input.addEventListener('change', function () {
						saveInputOptions(selectID, input);
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

		function finishLoading(range) {
				document.getElementById("loader").style.display = "none";
				document.getElementById("displayarea").style.display = "block";

				// Clears the selection so that nothing but what it selects next is selected on copy.
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
				document.execCommand('Copy');
				sel.removeAllRanges();

				var clipboardStatus = document.getElementById("clipboardstatus");
				if (browser == browser) {
						clipboardStatus.textContent = "(drag or right-click to copy)";
				} else {
						clipboardStatus.textContent = "(copied to clipboard)";
				}

				clipboardStatus.style.display = "block";
		}

    // SENDS MESSAGE TO latex_transport.js,
    // QUERYING IF DOUBLE CLICK EDIT HAS BEEN USED.
    // IF YES, DATA IS SENT BACK AND STORED IN retrieved_latex,
    Browser.runtime.sendMessage({ type: 'latex_retrieve' }, function(retrieved_latex) {
        // IF NO DOUBLE CLICK EDIT
        if (retrieved_latex == 'undefined'){
            // IF NO PREVIOUS CODE WAS ENTERED
            if (localStorage.getItem("code") != null){
                input.value = localStorage.getItem("code");
            }
        }
        else {   // DOUBLE CLICK EDIT WAS USED
            input.value = retrieved_latex;
            localStorage.setItem("code", retrieved_latex);
        }
        document.getElementById("code").select();
    });

    // LISTENS FOR KEY COMBO TO CONVERT IMAGE -- SEE BELOW
    document.body.addEventListener("keydown", function(e) {
        e = e || window.event;

        // Ctrl+Enter for Windows and Linux -- additional Command+Enter option for Mac
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
						submitCode(undefined);
        }
    });

		function submitCode (e) {
				if (e != undefined)
						e.preventDefault();

				// Also save the current options when the submit button is pressed.

				// Since the change event does not fire when the element still has focus,
				// compiling with C-RET and then having a syntax error does not save the
				// invalid code.

				inputs.forEach(element => saveInputOptions(element["selectid"], element["input"]));

				// Change user display
				document.getElementById("clipboardstatus").style.display = "none";
				let displayarea = document.getElementById("displayarea");
				displayarea.style.display = "none";
				displayarea.textContent = '';

				document.getElementById("loader").style.display = "block";

        // Get values from user configuration
				var data = JSON.stringify({
						"d": document.getElementById('DPI').value,
						"c": document.getElementById('color').value,
						"f": document.getElementById('font').value,
						"m": document.getElementById('displaystyle').checked,
						"t": document.getElementById('format').value,
						"raw": document.getElementById("code").value.replace(/\//g, '\\slash').replace(/\n/g, "").replace(/\$/g, "").replace(/\\\[/g, "")
				});

				// Post JSON with configuration options, and get the image returned.
				var postxhr = new XMLHttpRequest();
				var blobbed = !document.getElementById('blobbed').checked;

				if (blobbed) {
						postxhr.open("POST", server + '/blob', true);
				} else {
						postxhr.open("POST", server + '/post', true);
				}
				postxhr.setRequestHeader("Content-Type", "application/json");

				postxhr.onreadystatechange = function() {
						if (postxhr.readyState == 4) {
								if (postxhr.status == 200) {
										let range = document.createRange();
										if (format.value == "png" || format.value == "svg" || format.value == "gif") {
												let result = JSON.parse(postxhr.responseText);
												var img = document.createElement('img');
												img.onload = function () {
														document.getElementById("loader").style.display = "none";
														img.alt = result["result"];
														img.title = result["result"];

														if (!!document.getElementById('output')) {
																document.getElementById('output').remove();
														}

														document.getElementById('displayarea').appendChild(img);
														range.selectNode(img);
														finishLoading(range);
												};

												img.className = 'math';
												img.id = 'output';

												if (blobbed) {
														img.src = result["data"];
												} else {
														img.src = server + '/id/' + result["id"];
												}
										} else if (format.value == "mml" || format.value == "speech") {
												var par = document.createElement('p');
												par.textContent = postxhr.responseText;
												par.id = 'output';
												par.className = "enable-select";

												document.getElementById('displayarea').appendChild(par);
												range.selectNode(par);
												finishLoading(range);
										}
								} else if (postxhr.status == 500) {
										alert("TeX Math Here: popup.js: The given LaTeX code could not be compiled.\n" + JSON.parse(postxhr.responseText)['message']);
								} else {
										alert("TeX Math Here: popup.js: An internal server error has occurred: " + postxhr.status + ". Please ensure the latest version of Tex Math Here is installed. If it is, try again in a few minutes or contact the extension developer to check on the server status.\n\n Response: " + postxhr.responseText);
								}
						}
				};


				postxhr.timeout = 10000; // 10 seconds
				postxhr.ontimeout = function () {
						alert("The request to the server has timed out. Please verify your computer's network connection.");
				};

				postxhr.send(data);
		};

    // Submit - occurs when the user presses the "Submit" button or Ctrl+Enter
    // Should copy image to clipboard
    let form = document.getElementById('form');
    form.addEventListener('submit', submitCode);

}, false);
