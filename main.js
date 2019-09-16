window.browser = (function () {
    return window.msBrowser ||
        window.browser ||
        window.chrome;
})();

//Initialize variables
var symbolCode = [];
var backslashFlag = false;
var symbolOutput = null;
var position = 0;
var codeArray = [];
var correctionArray = [];
var tex;

// Insert custom corrections here following the same format as below.
// Make sure that the codes and corrections are entered in the same order
customCodes = []
customCorrections = []

// Generate corrections list
codeArray = ["alpha", "beta", "chi", "delta", "deltacap", "epsilon", "eta", "gamma", "gammacap", "iota", "kappa", "lambda", "lambdacap", "mu", "nu", "omega", "omegacap", "phi", "phicap", "pi", "picap", "psi", "psicap", "rho", "sigma", "sigmacap", "tau", "theta", "thetacap", "upsilon", "upsiloncap", "varepsilon", "varphi", "varpi", "varrho", "varsigma", "vartheta", "xi", "xicap", "zeta", "pm", "mp", "times", "div", "ast", "star", "circ", "bullet", "cdot", "cap", "cup", "uplus", "sqcap", "sqcup", "vee", "lor", "wedge", "land", "setminus", "wr", "diamond", "bigtriangleup", "bigtriangledown", "triangleleft", "triangleright", "oplus", "ominus", "otimes", "oslash", "odot", "bigcirc", "dagger", "ddagger", "amalg", "leq", "prec", "preceq", "ll", "subset", "subseteq", "sqsubset", "sqsubseteq", "in", "vdash", "geq", "succ", "succeq", "gg", "supset", "supseteq", "sqsupset", "sqsupseteq", "ni", "dashv", "equiv", "sim", "simeq", "approx", "cong", "doteq", "notin", "models", "perp", "parallel", "bowtie", "Join", "propto", "leftarrow", "leftarrowcap", "rightarrow", "rightarrowcap", "leftrightarrow", "leftrightarrowcap", "mapsto", "hookleftarrow", "leftharpoonup", "leftharpoondown", "rightleftharpoons", "longleftarrow", "longrightarrow", "longleftrightarrow", "longmapsto", "hookrightarrow", "rightharpoonup", "rightharpoondown", "uparrow", "uparrowcap", "downarrow", "downarrowcap", "updownarrow", "updownarrowcap", "nearrow", "searrow", "swarrow", "nwarrow", "aleph", "hbar", "imath", "jmath", "ell", "wp", "mho", "prime", "emptyset", "nabla", "top", "bot", "|", "angle", "forall", "exists", "lnot", "flat", "natural", "sharp", "backslash", "partial", "infty", "Diamond", "triangle", "clubsuit", "diamondsuit", "heartsuit", "spadesuit", "int", "notni", "exists", "nexists", "forall", "neq", "minus", "calliga", "calligb", "calligc", "calligd", "callige", "calligf", "calligg", "calligh", "calligi", "calligj", "calligk", "calligl", "calligm", "callign", "calligo", "calligp", "calligq", "calligr", "calligs", "calligt", "calligu", "calligv", "calligw", "calligx", "calligy", "calligz"]
correctionArray = ["α", "β", "χ", "δ", "Δ", "ϵ", "η", "γ", "Γ", "ι", "κ", "λ", "Λ", "μ", "ν", "ω", "Ω", "ϕ", "Φ", "π", "Π", "ψ", "Ψ", "ρ", "σ", "Σ", "τ", "θ", "Θ", "υ", "ϒ", "ε", "φ", "ϖ", "ϱ", "ς", "ϑ", "ξ", "Ξ", "ζ", "±", "∓", "×", "÷", "∗", "★", "◦", "•", "·", "∩", "∪", "⊎", "⊓", "⊔", "∨", "∨", "∧", "∧", "\\", "≀", "⋄", "△", "▽", "◃", "▹", "⊕", "⊖", "⊗", "⊘", "⊙", "◯", "†", "‡", "⨿", "≤", "≺", "⪯", "≪", "⊂", "⊆", "⊏", "⊑", "∈", "⊢", "≥", "≻", "⪰", "⋙", "⊃", "⊇", "⊐", "⊒", "∋", "⫤", "≡", "∼", "≃", "≈", "≅", "≐", "∉", "⊧", "⊥", "∥", "⋈", "⨝", "∝", "←", "⇐", "→", "⇒", "↔", "⇔", "↦", "↩", "↼", "↽", "⇌", "⟵", "⟶", "⟺", "⟼", "↪", "⇀", "⇁", "↑", "⇑", "↓", "⇓", "↕", "⇕", "↗", "↘", "↙", "↖", "ℵ", "ℏ", "ı", "ȷ", "ℓ", "℘", "℧", "′", "∅", "∇", "⊤", "⊥", " | ", "∠", "∀", "∃", "¬", "♭", "♮", "♯", "∖", "∂", "∞", "⋄", "▵", "♣", "♦", "♥", "♠", "∫", "∌", "∃", "∄", "∀", "≠", "−", "𝒜", "ℬ", "𝒞 ", "𝒟", "ℰ", "ℱ", "𝒢", "ℋ", "ℐ", "𝒥", "𝒦", "ℒ", "ℳ", "𝒩", "𝒪", "𝒫", "𝒬", "ℛ", "𝒮", "𝒯", "𝒰", "𝒱", "𝒲", "𝒳", "𝒴", "𝒵"]

function checkAgainstList(symbolCode) {
    // Searches for symbolCode in a list of corrections, returns a string of
    // the corrected version (or null if a match is not found)
    var i;

    // Ensure custom codes/corrections are created properly
    if (customCorrections.length == customCodes.length) {
        for (i = 0; i < customCodes.length; i++) {
            if (symbolCode == customCodes[i]) {
                return customCorrections[i];
            }
        }
    }
    for (i = 0; i < codeArray.length; i++) {
        if (symbolCode == codeArray[i]) {
            return correctionArray[i];
        }
    }
    return null;
}

// Code from https://stackoverflow.com/a/34278578
function typeInTextarea(el, newText) {
    var start = el.selectionStart
    var end = el.selectionEnd
    var text = el.value
    var before = text.substring(0, start - position - 1)
    var after = text.substring(end, text.length)
    el.value = (before + newText + after)
    el.selectionStart = el.selectionEnd = start + newText.length
    el.focus()
}

function typeInTextareaBackup(el, newText) {
    var start = el.selectionStart
    var end = el.selectionEnd
    var text = el.value
    var before = text.substring(0, start)
    var after = text.substring(end, text.length)
    el.value = (before + newText + after)
    el.selectionStart = el.selectionEnd = start + newText.length
    el.focus()
}

// Function to execute replacement
function replacement(symbolOutput) {
    //document.body.style.border = "5px solid red";
    typeInTextarea(document.activeElement, symbolOutput);
}

// Button for TeX input
// Prompt to get TeX value
function promptForTeX() {
    //tex = window.prompt('Enter TeX here');
    document.body.style.border = "5px solid red";
}


// Listen to input
document.addEventListener('keypress', function (e) {
    e = e || window.event;
    var charCode = typeof e.which == "number" ? e.which : e.keyCode;
    if (!backslashFlag) {
        // Listen for leading backslash
        if (charCode == 92) {
            backslashFlag = true;
            symbolCode = [];
            position = 0;
        }
    }
    else {
        // Record after leading backslash
        if (charCode == 32 || charCode == 13) {
            // Check at space or carriage return
            // (want to include tab = 9, but does not work in keypress or keydown)
            symbolOutput = checkAgainstList(symbolCode.join(""))
            if (symbolOutput != null) {
                replacement(symbolOutput);
            }

            backslashFlag = false;
        }
        else if (charCode == 8) {
            // Deal with backspace
            position--;
            symbolCode[position] = null;
        }
        else if (charCode) {
            symbolCode[position] = String.fromCharCode(charCode);
            position++;
        }
    }
});

document.addEventListener('keydown', function (e) {
    // Deal with keys that don't trigger keypress
    e = e || window.event;
    var charCode = typeof e.which == "number" ? e.which : e.keyCode;
    if (charCode == 37 || charCode == 38 || charCode == 39 || charCode == 40) {
        // Break at arrow keys
        backslashFlag = false;
    }
});
