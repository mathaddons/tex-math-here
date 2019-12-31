document.addEventListener('DOMContentLoaded', function () {
    let Browser;
    let server = "http://localhost:5000/";

    // DETECT BROWSER TYPE FOR PROPER API USE
    try {
        // FOR FIREFOX
        Browser = browser;
        document.getElementById("color").disabled = true;
    } catch(e) {
        try {
            // FOR CHROME
            Browser = chrome;

        } catch(e) {
            console.error('TeX Math Here: popup.js: ERROR BROWSER TYPE NOT DETECTED!');
        }
    }

    // Populate the font selector from local fonts.json.
    $(document).ready(function() {
        let font_selector = $('#font');
        font_selector.empty();

        // $.getJSON(server + "fonts", function (data) {
        //     fonts = data;
        // });

        $.getJSON(server + "fonts", function (data) {
            $.each(data, function (key, entry) {
                font_selector.append($('<option></option>').attr('value', key).text(entry.description));
            })
        })
    });
    // Sets values of the options before the user
    //+ has entered their own selections
    //+ (which would then be stored in localStorage)
    function setDefaultValue(id, optionType){
        // Checks whether there is anything stored for that ID
        if(localStorage.getItem(id) === null){
            if(optionType === "rgb"){
                // sets rgb value to 0 as default value
                localStorage.setItem(id, 0);
            }
            else if (optionType === "fontSize"){
                // sets DPI value to 180 (aka 18pt) if localStorage is empty for id = DPI
                localStorage.setItem(id, "180");
            }
            else if (optionType === "fontStyle"){
                // sets font to Latin Modern if localStorage is empty for id = font
                localStorage.setItem(id, "computer-modern");
            }
        }
    }

    setDefaultValue("red", "rgb");
    setDefaultValue("blue", "rgb");
    setDefaultValue("green", "rgb");
    setDefaultValue("DPI", "fontSize");
    setDefaultValue("font", "fontStyle");

    // Keep option values/selections persistent after extension closes
    function persistentOptions(selectID) {
        // Sets input equal to the current element of the id passed in
        var input = document.getElementById(selectID);
        // When the input changes for the id passed in, the key value (the id) is set the value of the new input
        input.addEventListener('input', function () {
            localStorage.setItem(selectID, input.value);
        });
        // Sets the value in the html with the localStorage value of the specified key/ID
        input.value = localStorage.getItem(selectID);
    }

    persistentOptions("red");
    persistentOptions("blue");
    persistentOptions("green");
    persistentOptions("DPI");
    persistentOptions("font");



    var input = document.getElementById("code");

    // Listens for a change of input in the text box
    input.addEventListener('input', function () {
        // User's input is stored in the text box
        //+ after they click away from the extension
        //+ (assumes that localstorage is supported on the browser)
        localStorage.setItem("text", input.value);

        // Alert to make the user aware that certain text will be removed in the php file
        function checkInput(text) {
            if (input.value.includes(text)) {
                // Alerted is set to "yes" if the alert has already
                //+ been shown for the key value, otherwise it is set to null
                // Session storage used so the value "yes" does not persist
                //+ if the extension is closed and then reopened
                let alerted = sessionStorage.getItem(text) || null;
                // If the alert has not been shown yet
                //+ (and therefore is set to null), the alert message will appear
                //+ and the key's value is set to "yes"
                if(alerted != "yes") {
                    alert("The Latex " + text + " will be removed from the output.");
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
        if (retrieved_latex == 'undefined')
        {
            // IF NO PREVIOUS CODE WAS ENTERED
            if (localStorage.getItem("text") == null)
            {
                input.value = 'Enter code here';
            }
            else    // CODE WAS PREVIOUSLY ENTERED
            {
                input.value = localStorage.getItem("text");
            }
        }
        else    // DOUBLE CLICK EDIT WAS USED
        {
            input.value = retrieved_latex;
            localStorage.setItem("text", retrieved_latex);
        }

        document.getElementById("code").select();
    });

    let color = document.getElementById('color');

    // If the color is changed through the color picker menu the rgb values are updated accordingly.
    // Reference for hexToRgb function:
    // https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
    color.addEventListener('change', (e) => {
        //Takes hex (color.value) and returns the red, green, and blue rgb values
        function hexToRgb(hex) {
            var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        }

        redColor = hexToRgb(color.value).r;
        greenColor = hexToRgb(color.value).g;
        blueColor = hexToRgb(color.value).b;

        // Set value of rgb input boxes to the rgb values selected in the color picker
        document.getElementById('red').value = redColor;
        document.getElementById('green').value = greenColor;
        document.getElementById('blue').value = blueColor;

        // Make the values selected from color picker persistent
        localStorage.setItem("red", redColor);
        localStorage.setItem("green", greenColor);
        localStorage.setItem("blue", blueColor);
    });

    // Adjusts color in the color picker box accroding to rgb value entered
    function colorPickerChange(){

        let red = document.getElementById('red');
        let green = document.getElementById('green');
        let blue = document.getElementById('blue');

        // Changes rgb decimal values to hex value
        function rgbToHex (rgb) {
            var hex = Number(rgb).toString(16);
            if (hex.length < 2) {
                hex = "0" + hex;
            }
            return hex;
        };

        // Combines red, green, blue hex values to get hex color value
        function fullColorHex (r,g,b) {
            var red = rgbToHex(r);
            var green = rgbToHex(g);
            var blue = rgbToHex(b);
            return "#" + red + green + blue;
        };

        var fullHex = fullColorHex(red.value, green.value, blue.value);

        // Sets the value in the html (with id = color) to the hex value for the rgb values entered
        document.getElementById('color').value = fullHex;
    }

    // Loads last selected color in color picker box when extension is first opened
    colorPickerChange();

    // Adjusts color according to entered rgb values whenever there is a mousedown
    document.body.addEventListener("mousedown", function(){
        colorPickerChange();
    });

    // Adjusts color according to entered rgb value whenever the tab button is pressed
    document.body.addEventListener("keydown", function (e){
        if(e.keyCode == '9')
        {
            colorPickerChange();
        }
    });


    // LISTENS FOR KEY COMBO TO CONVERT IMAGE -- SEE BELOW
    document.body.addEventListener("keydown", function(e) {
        e = e || window.event;

        // Ctrl+Enter for Windows and Linux -- additional Command+Enter option for Mac
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
        {
            // GET ELEMENT THAT IS IN FOCUS
            let focusElement = document.activeElement;

            // IN CASE ELEMENT IN FOCUS IS A TEXT BOX
            // BLURS IT SO STRANGE FIREFOX Ctrl+Enter AUTO-COPY BUG DOES NOT OCCUR
            focusElement.blur();

            // SIMULATES A CLICK ON THE CONVERT BUTTON
            document.getElementById('submitButton').click();

            // PUTS ELEMENT THAT WAS PREVIOUSLY IN FOCUS BACK IN FOCUS
            focusElement.focus();
        }
    });


    let form = document.getElementById('form');

    // Submit - occurs when the user presses the "Submit" button or Ctrl+Enter
    // Should copy image to clipboard
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Get values from user configuration
        let font = document.getElementById('font');
        let DPI = document.getElementById('DPI');
        let colour = document.getElementById('color');
        let latex = e.target.children.code.value;

        // Prepares latex input for url
        latex = encodeURIComponent(latex);

        // All session storage info cleared (user will be alerted if certain text is entered per function checkInput())
        sessionStorage.clear();

        // Set URL using configuration options
        let dataString = "?d=" + DPI.value +
            "&c=" + colour.value.slice(1) +
            "&f=" + font.value;

        let value = server + 'compile/' + latex + dataString;

        var xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            // If the server has responded
            if (xhr.readyState == 4) {
                // REMOVE PREVIOUS IMAGE BEFORE ADDING NEW ONE, CHECKING IF IT EXISTS FIRST
                let imageExists = !!document.getElementById('latex_image');
                if (imageExists) {
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

            //If the server has responded with an empty message and the browser is chrome
            if(xhr.readyState == 4 && xhr.status == 0 && Browser == chrome){
                alert("Please ensure the latest version of Tex Math Here is installed. If it is, try again in a few minutes.")
            }

            // Triggers xhr.status = 0 if it hasn't proccessed already or hasn't already arrived at that state
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
