var fs = require( "fs" );
var path = require( "path" );

var source = fs.readFileSync( path.join( __dirname, "..", "..", "src", "atk14.js" ), "utf8" );

// ATK14.action and the document-level event delegation are set up once, at
// script-evaluation time, so each test that needs a fresh instance (eg. to
// read a different <meta name="x-action"> tag) must re-evaluate the source.
// Indirect eval runs in the global scope, so the "var ATK14 = ..." at the
// top of the file attaches to `window`, just like a <script> tag would.
function loadAtk14() {
	// Remove handlers bound to `document` by a previous load, otherwise they'd
	// pile up (every click/submit would run once per reload).
	$( document ).off( "click submit ajaxStart ajaxStop" );

	delete window.ATK14;
	var indirectEval = eval;
	indirectEval( source );
	return window.ATK14;
}

module.exports = loadAtk14;
