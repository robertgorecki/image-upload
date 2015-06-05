(function(window, Image, FileReader){
	"use strict";

	var document = window.document,
		thumbWidth = 150,
		thumbHeight = 150;

	/**
	 * Publish/Subscribe for binding view to model.
	 * View should subscribe to model changes and update itself.
	 */
	function PubSub(){
		this.events = {};
	}
	/**
	 * Publish event to all subscribers
	 * @param  {String} eventName key to which publish
	 * @param  {Mixed}  arg       any argument you want to pass to subscribers
	 * @return {PubSub} instance (for chaining)
	 */
	PubSub.prototype.trigger = function(eventName, arg) {
		if (this.events[eventName]) {
			var i = this.events[eventName].length - 1;
			for (i; i >= 0; i -= 1) {
				this.events[eventName][i](arg);
			}
		}
		return this;
	};
	/**
	 * Subscribe to events
	 * @param  {String} eventName key to which you're subscribing
	 * @param  {Function} callback
	 * @return {PubSub} instance (for chaining)
	 */
	PubSub.prototype.on = function (eventName, callback) {
		(this.events[eventName] = this.events[eventName] || []).push(callback);
		return this;
	};
	/**
	 * Model for representing single image on the page
	 * @param {Object} attributes key/value pair of model attrs
	 */
	function Img(attributes) {
		this.attrs = attributes;
	}
	/**
	 * Retrieve the attribute of the model by key
	 * @param  {String} key attribute to be returned
	 * @return {Mixed}  value of the attribute or undefined if it doesn't exist
	 */
	Img.prototype.get = function(key) {
		return this.attrs[key];
	};
	/**
	 * Model to represent collection of all images on the page
	 */
	function ImgCollection() {
		this.list = [];
	}
	/**
	 * Extending ImgCollection with PubSub
	 */
	ImgCollection.prototype = new PubSub();
	ImgCollection.prototype.constructor = ImgCollection;
	/**
	 * Adding image model to a collection
	 * @param {Img} image model representing single image
	 * @return {ImgCollection} instance (for chaining)
	 */
	ImgCollection.prototype.add = function(image) {
		image.collection = this;
		this.list.push(image);
		this.trigger("add", image);

		return this;
	};
	/**
	 * View class for entire images collection
	 * @param {Object} options simple object with required attributes
	 * 							collection - model to which this view should subscribe
	 */
	function ImgCollectionView(options) {
		var collection = options.collection;
		this.tmpl = document.getElementById("collection-template").innerHTML;

		//subscribing to model changes
		collection.on("add", function(item) {
			new ImgView(item).render(this.el);
		}.bind(this));
	}
	/**
	 * Rendering view on the page
	 * @param  {Element} el DOM node to which attach this view
	 * @return {ImgCollectionView} instance (for chaining)
	 */
	ImgCollectionView.prototype.render = function(el) {
		var list = document.createElement("div");
		list.innerHTML = this.tmpl;
		el.appendChild(list);
		this.el = el.querySelector(".images-list");

		return this;
	};
	/**
	 * View class for single image
	 * @param {Img} model object representing single image
	 */
	function ImgView(model) {
		this.model = model;
		this.tmpl = document.getElementById("image-template").innerHTML;
	}
	/**
	 * Rendering image on the page
	 * @param  {Element} el DOM node to which attach this view
	 * @return {ImgView} instance (for chaining)
	 */
	ImgView.prototype.render = function(el) {
		var img = new Image(),
			li = document.createElement("li");
		img.src = this.model.get("thumbSizeDataUrl");
		li.innerHTML = this.tmpl;
		li.appendChild(img);
		el.appendChild(li);
		this.addListeners(li);
		return this;
	};
	/**
	 * Adds event listeners to this view
	 * @param  {Element} el DOM node to which attach listeners
	 * @return {ImgView} instance (for chaining)
	 */
	ImgView.prototype.addListeners = function(el) {
		el.querySelector(".zoom").addEventListener("click", function(){
			var fullSizeDataUrl = this.model.get("fullSizeDataUrl"),
				width = this.model.get("width"),
				height = this.model.get("height");
			this.openFullSize(fullSizeDataUrl, width, height);
		}.bind(this));

		return this;
	};
	/**
	 * Opens new window with original image
	 * @param  {String} fullSizeDataUrl image data in data url format
	 * @return {ImgView} instance (for chaining)
	 */
	ImgView.prototype.openFullSize = function(fullSizeDataUrl, width, height) {
		var windowsSpec = ['width=', width, ',height=', height, ',scrollbars=1,resizable=1'].join(""),
			previewWindow = window.open("","preview",windowsSpec),
			html = ['<img src="', fullSizeDataUrl, '">'].join("");

		previewWindow.document.open();
		previewWindow.document.write(html);
		previewWindow.document.close();

		return this;
	};
	/**
	 * View class for upload form/area
	 * @param {Object} options simple object with required attributes
	 * 							collection - model to which this view should subscribe
	 */
	function UploadView(options) {
		this.tmpl = document.getElementById("upload-template").innerHTML;
		this.collection = options.collection;
	}
	/**
	 * Rendering upload form on the screen
	 * @param  {Element} el DOM node to which attach this view
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.render = function(el) {
		el.innerHTML = this.tmpl;
		this.addListeners(el);

		return this;
	};
	/**
	 * Adds event listeners to this view
	 * @param  {Element} el DOM node to which attach listeners
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.addListeners = function(el) {
		var dropZone = el.querySelector(".drop-zone"),
			fileInput = el.querySelector(".file");
		fileInput.addEventListener("change", this.onFileInput.bind(this));
		dropZone.addEventListener("dragover", this.onDragOver.bind(this));
		dropZone.addEventListener("drop", this.onFileDrop.bind(this));

		return this;
	};
	/**
	 * Handle file selection by file input
	 * @param  {Event} evt
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.onFileInput = function(evt) {
		var files = evt.target.files;
		this.onFilesSelected(files);

		return this;
	};
	/**
	 * Handle file drag n drop
	 * @param  {Event} evt
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.onDragOver = function(evt) {
		evt.stopPropagation();
		evt.preventDefault();

		return this;
	};
	/**
	 * Handle file selection by file input
	 * @param  {Event} evt
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.onFileDrop = function(evt) {
		evt.stopPropagation();
		evt.preventDefault();
		var files = evt.dataTransfer.files;
		this.onFilesSelected(files);

		return this;
	};
	/**
	 * Handle files upload
	 * @param  {FileList} files array of uploaded files (File type)
	 * @return {UploadView} instance (for chaining)
	 */
	UploadView.prototype.onFilesSelected = function(files) {
		//loop through all files
		for (var i = 0, uploadedFile; uploadedFile = files[i]; i++) {
			if (!uploadedFile.type.match("image.*")) {
				//only process images
				continue;
			}
			var reader = new FileReader();
			//closure required here because of for loop
			reader.onload = (function(imageFile) {
				return function(e) {
					var fullSizeDataUrl, img, thumbSizeDataUrl, model;
					//arget.result will contain data url because
					//were using readAsDataURL to red the image data
					fullSizeDataUrl = e.target.result;
					//for creating thumbnails, it's creating Image object for original image
					//and using canvas to scale it
					img = new Image();
					img.onload = function(e) {
						thumbSizeDataUrl = this.getThumbnailDataUrl(img, thumbWidth, thumbHeight);
						//creating model representing newly uploaded image
						model = new Img({
							name: imageFile.name,
							type: imageFile.type,
							size: imageFile.size,
							fullSizeDataUrl: fullSizeDataUrl,
							thumbSizeDataUrl: thumbSizeDataUrl,
							width: img.naturalWidth,
							height: img.naturalHeight
						});
						//adding model to collection
						this.collection.add(model);
					}.bind(this);
					img.src = fullSizeDataUrl;
				}.bind(this);
			}.bind(this))(uploadedFile);
			//read uploaded image
			reader.readAsDataURL(uploadedFile);
		}
		return this;
	}
	/**
	 * Generate dataUrl representing scaled image using canvas
	 * @param  {Image} image original image object
	 * @param  {Number} newWidth desired width of new image
	 * @param  {Number} newHeight desired height of new image
	 * @return {String} dataUrl of newly created image
	 */
	UploadView.prototype.getThumbnailDataUrl = function(image, newWidth, newHeight) {
		var canvas = document.createElement("canvas")
		canvas.width = newWidth;
		canvas.height = newHeight;
		canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL("image/png");
	};
	/**
	 * Class representing the whole app
	 */
	function UploadApp() {
	}
	/**
	 * Starting the application, it will create all required models, views,
	 * and wire them together.
	 * @param  {Element} el DOM node to which attach this view
	 * @return {UploadApp} instance
	 */
	UploadApp.prototype.start = function(el) {
		if (this.isSupported()) {
			var collection  = new ImgCollection(),
				options = {
					collection: collection
				};

			new UploadView(options).render(el);
			new ImgCollectionView(options).render(el);
		} else {
			alert("File API not supported. Please use modern browser.");
		}

		return this;
	};
	/**
	 * Check if current browser is supporting File API
	 * @return {Boolean} true if browser is supported, false otherwise
	 */
	UploadApp.prototype.isSupported = function() {
		return window.File && window.FileReader && window.FileList;
	};

	/**
	 * Export UploadApp
	 * (can check for "define" but I will just export to global window object)
	 */

	window.UploadApp = UploadApp;

})(window, Image, FileReader);
