(function(){

	/**
	 * Starting point of this project
	 */
	function insertUploadWidget(selector) {
		var el = document.querySelector(selector);
		new UploadApp().start(el);
	};
	//Let's get this party started!
	insertUploadWidget(".upload-app");

})();