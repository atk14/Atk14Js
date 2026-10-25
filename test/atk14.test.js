var loadAtk14 = require( "./helpers/load-atk14" );

describe( "ATK14.action", function() {
	test( "reads the content of <meta name=\"x-action\">", function() {
		document.head.innerHTML = "<meta name=\"x-action\" content=\"articles:index\">";
		var ATK14 = loadAtk14();
		expect( ATK14.action ).toBe( "articles:index" );
	} );
} );

describe( "links with data-remote", function() {
	var ATK14;

	beforeEach( function() {
		document.head.innerHTML = "";
		document.body.innerHTML = "";
		ATK14 = loadAtk14();
	} );

	test( "sends a GET request and appends __xhr_request=1", function() {
		document.body.innerHTML = "<a href=\"/articles?page=2\" data-remote=\"true\">Load</a>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "a" ).trigger( "click" );

		var settings = ajaxSpy.mock.calls[ 0 ][ 0 ];
		expect( settings.type ).toBe( "GET" );
		expect( settings.url ).toBe( "/articles?page=2&__xhr_request=1" );

		ajaxSpy.mockRestore();
	} );

	test( "uses data-href instead of href when present", function() {
		document.body.innerHTML = "<a href=\"/fallback\" data-href=\"/real-target\" data-remote=\"true\">Load</a>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "a" ).trigger( "click" );

		expect( ajaxSpy.mock.calls[ 0 ][ 0 ].url ).toBe( "/real-target?__xhr_request=1" );

		ajaxSpy.mockRestore();
	} );

	test( "sends the HTTP method from data-method", function() {
		document.body.innerHTML = "<a href=\"/articles/1\" data-remote=\"true\" data-method=\"delete\">Delete</a>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "a" ).trigger( "click" );

		expect( ajaxSpy.mock.calls[ 0 ][ 0 ].type ).toBe( "DELETE" );

		ajaxSpy.mockRestore();
	} );

	test( "triggers ajax:success and eval()'s the response for conscript dataType", function() {
		document.body.innerHTML = "<a href=\"/articles/1\" data-remote=\"true\">Load</a>";
		window.__sideEffect = false;
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function( settings ) {
			settings.success( "window.__sideEffect = true;", "success", {} );
		} );
		var successHandler = jest.fn();
		$( "a" ).on( "ajax:success", successHandler );

		$( "a" ).trigger( "click" );

		expect( ajaxSpy.mock.calls[ 0 ][ 0 ].dataType ).toBe( "conscript" );
		expect( successHandler ).toHaveBeenCalled();
		expect( window.__sideEffect ).toBe( true );

		ajaxSpy.mockRestore();
	} );
} );

describe( "data-confirm", function() {
	beforeEach( function() {
		document.head.innerHTML = "";
		document.body.innerHTML = "<a href=\"/articles/1\" data-remote=\"true\" data-confirm=\"Really?\">Delete</a>";
		loadAtk14();
	} );

	test( "blocks the action when the user declines", function() {
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );
		window.confirm = jest.fn().mockReturnValue( false );

		$( "a" ).trigger( "click" );

		expect( window.confirm ).toHaveBeenCalledWith( "Really?" );
		expect( ajaxSpy ).not.toHaveBeenCalled();

		ajaxSpy.mockRestore();
	} );

	test( "allows the action when the user confirms", function() {
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );
		window.confirm = jest.fn().mockReturnValue( true );

		$( "a" ).trigger( "click" );

		expect( ajaxSpy ).toHaveBeenCalledTimes( 1 );

		ajaxSpy.mockRestore();
	} );
} );

describe( "forms with data-remote", function() {
	beforeEach( function() {
		document.head.innerHTML = "";
		document.body.innerHTML = "";
		loadAtk14();
	} );

	test( "GET forms are serialized and get __xhr_request=1 appended", function() {
		document.body.innerHTML =
			"<form action=\"/search\" method=\"get\" data-remote=\"true\">" +
				"<input type=\"text\" name=\"q\" value=\"atk14\">" +
			"</form>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "form" ).trigger( "submit" );

		var settings = ajaxSpy.mock.calls[ 0 ][ 0 ];
		expect( settings.type ).toBe( "GET" );
		expect( settings.url ).toBe( "/search?__xhr_request=1" );
		expect( settings.data ).toEqual( [ { name: "q", value: "atk14" } ] );

		ajaxSpy.mockRestore();
	} );

	test( "POST forms are sent as FormData, without __xhr_request", function() {
		document.body.innerHTML =
			"<form action=\"/articles\" method=\"post\" data-remote=\"true\">" +
				"<input type=\"text\" name=\"title\" value=\"Hello\">" +
			"</form>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "form" ).trigger( "submit" );

		var settings = ajaxSpy.mock.calls[ 0 ][ 0 ];
		expect( settings.type ).toBe( "POST" );
		expect( settings.url ).toBe( "/articles" );
		expect( settings.data ).toBeInstanceOf( FormData );
		expect( settings.data.get( "title" ) ).toBe( "Hello" );
		expect( settings.processData ).toBe( false );
		expect( settings.contentType ).toBe( false );

		ajaxSpy.mockRestore();
	} );

	test( "clicking a named submit button adds its name/value as an extra param", function() {
		document.body.innerHTML =
			"<form action=\"/articles/1\" method=\"post\" data-remote=\"true\">" +
				"<button type=\"submit\" name=\"commit\" value=\"Publish\">Publish</button>" +
			"</form>";
		var ajaxSpy = jest.spyOn( $, "ajax" ).mockImplementation( function() {} );

		$( "button" ).trigger( "click" );

		var settings = ajaxSpy.mock.calls[ 0 ][ 0 ];
		expect( settings.data.get( "commit" ) ).toBe( "Publish" );

		ajaxSpy.mockRestore();
	} );
} );

describe( "links with data-method (no data-remote)", function() {
	beforeEach( function() {
		document.head.innerHTML = "";
		document.body.innerHTML = "";
		loadAtk14();
	} );

	test( "GET/POST verbs submit a plain form, without a _method field", function() {
		document.body.innerHTML = "<a href=\"/articles?page=2\" data-method=\"get\">Page 2</a>";
		var submitSpy = jest.spyOn( HTMLFormElement.prototype, "submit" ).mockImplementation( function() {} );

		$( "a" ).trigger( "click" );

		expect( submitSpy ).toHaveBeenCalledTimes( 1 );
		var form = submitSpy.mock.instances[ 0 ];
		expect( form.getAttribute( "method" ) ).toBe( "get" );
		expect( form.getAttribute( "action" ) ).toBe( "/articles?page=2" );
		expect( form.querySelector( "input[name=_method]" ) ).toBeNull();

		submitSpy.mockRestore();
	} );

	test( "other verbs are submitted as POST with a hidden _method field", function() {
		document.body.innerHTML = "<a href=\"/articles/1\" data-method=\"delete\">Delete</a>";
		var submitSpy = jest.spyOn( HTMLFormElement.prototype, "submit" ).mockImplementation( function() {} );

		$( "a" ).trigger( "click" );

		expect( submitSpy ).toHaveBeenCalledTimes( 1 );
		var form = submitSpy.mock.instances[ 0 ];
		expect( form.getAttribute( "method" ) ).toBe( "post" );
		expect( form.getAttribute( "action" ) ).toBe( "/articles/1" );
		expect( form.querySelector( "input[name=_method]" ).value ).toBe( "delete" );

		submitSpy.mockRestore();
	} );
} );
