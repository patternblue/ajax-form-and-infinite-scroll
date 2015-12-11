// The module pattern 
// an Immediately-invoked anonymous function
// executed with jQuery as argument, so I can extend the jQuery prototype with my plugin
(function($){

	// validation rules constructor 
	function ValidationRules(){
		var _rules = {};

		// public objects
		return {  
			addRule : function(name, rule) { 
				_rules[name] = rule; 
			}, 
			getRule : function(name) { 
				return _rules[name]; 
			},
			getRegExp: function(pattern){
				return new RegExp("^"+pattern+"$","");
			},
			testPattern: function(value, regExp){ 
				return regExp.test(value); 
			} 
		}
	}

	function Form ($form) {
		var fields = []; 
		 // HTMLFormElement.elements property returns an HTMLFormControlsCollection (HTML 4 HTMLCollection) of all the form controls contained in the FORM element
		//  (Get all input elements in form) 
		$($form[0].elements).each(function() { 
			var $field = $(this); 
			// fields need a validation attribute 
			if($field.attr('validation') !== undefined) { 
				fields.push(new Field($field));
			}
		});
		this.fields = fields;
	}

	Form.prototype = {
		constructor: Form,
		validate : function() {
			for(var fieldIndex in this.fields){
				this.fields[fieldIndex].validate(); 
			}
		},
		isValid : function(){
			for(var fieldIndex in this.fields){
				if(!this.fields[fieldIndex].valid){
					// Focus on the first field with an error 
					this.fields[fieldIndex].$field.focus();
					return false;
				}
			}
			return true;
		}
	} 

	function Field($field){
		this.$field = $field;
		this.valid = false;
		this.attach('change'); // call attach() to attach a 'change' event listener
	}

	Field.prototype = {
		constructor: Field,
		attach : function(event) {
			var fieldObj = this; 
			if(event == "change"){
				fieldObj.$field.bind("change",function() {
					return fieldObj.validate();
				});
			}
			if(event == "keyup"){
				fieldObj.$field.bind("keyup",function(e){
					return fieldObj.validate();
				});
			}
		},
		validate: function(){
			var fieldObj = this,
				$field = fieldObj.$field,
				$errorList = $(document.createElement('ul')).addClass('errorList'),
				// get all validation attributes (rule names) from the field
				ruleTypes = $field.attr("validation").split(" "),
				$container = $field.parent(),
				errorMessages = [];

				$field.next(".errorList").remove();

				// check every rule in that field
				for(var typeIndex in ruleTypes){
					var rule = $.validationRules.getRule(ruleTypes[typeIndex]);
					if (!rule.check($field.val())){
						$container.addClass('error');
						errorMessages.push(rule.msg);
					}
				}

				// if any errors, display them
				if(errorMessages.length) {
					// Remove existing event handler 
					fieldObj.$field.unbind("keyup") 
					// Attach the keyup event to the field because now 
					// we want to let the user know as soon as she has 
					// corrected the error 
					fieldObj.attach("keyup"); 
					// Empty existing errors, if any. Then add the error list after the field 
					$field.after($errorList.empty());
					for(var errorIndex in errorMessages) { 
						$errorList.append("<li>"+ errorMessages[errorIndex] +"</li>"); 
					} 
					fieldObj.valid = false; 
				}else{
					$errorList.remove(); 
					$container.removeClass("error"); 
					fieldObj.valid = true; 
				} 

		}
	}

	// make my validationRules object and add rules to it

	$.validationRules = new ValidationRules();

	// required rule
	$.validationRules.addRule('required', {
		check: function(value) {
			if(value) { 
				return true; 
			}else { 
				return false; 
			} 
		}, 
		msg : "This field is required." 
	}); 
	// requireAtLeastOne
	$.validationRules.addRule('requireAtLeastOne', {
		check: function(value) {
			if(value) { 
				return true; 
			}else { 
				return false; 
			} 
		}, 
		msg : "At least one of these fields is required." 
	}); 

	// movieID rule
	$.validationRules.addRule('movieID',{
		check: function(value){
			if(value){
				// 2 letters, 7 numbers
				var regExp = $.validationRules.getRegExp('[a-z]{2}[0-9]{7}');
				return $.validationRules.testPattern(value, regExp);
			}
			return true;
		},
		msg: "Provide a valid ID"
	});
	// year rule
	$.validationRules.addRule('year',{
		check: function(value){
			if(value){
				var regExp = $.validationRules.getRegExp('[0-9]{4}');
				return $.validationRules.testPattern(value, regExp);
			}
			return true;
		},
		msg: "Provide a valid year"
	});
	
	// extend this object to jQuery prototype so any jQuery object shares these methods
	var validationExtension = {
		validation: function(){
			// this = any jQuery object
			var validatorForm = new Form(this);
			this.bind("submit", function(event) {
				validatorForm.validate();
				if(!validatorForm.isValid()){
					// prevent the page from refreshing/submitting if there are any errors
					console.log('prevented');
					event.preventDefault();
				} 
			});
			// validate all fields in the form, return isValid or not
			this.validate = function(){
				validatorForm.validate();
				return validatorForm.isValid(); 
			}
		}
	}
	$.extend(true, $.fn, validationExtension);

})(jQuery);


// run the plugin on my form when the DOM is ready
$(document).ready(function(){
	var $myForm = $('#myForm');
	$myForm.validation();

	// display submit error if any field has errors
	$('#submit').click(function(event){

		// check if either title or movieID is filled in
		if($('#title').val()){
			// console.log('ran');
			$('#title').attr('validation', 'title');
			$('#movieID').attr('validation', 'movieID');
		}else{
			$('#title').attr('validation', 'requireAtLeastOne title');
			$('#movieID').attr('validation', 'requireAtLeastOne movieID');			
		}

		if(!$myForm.validate()){
			$('#submitError').show();
		}else{
			$('#submitError').hide();
			var t = $('#title').val();
			var i = $('#movieID').val();
			var type = $('#type :selected').text();
			var y = $('#year').val();
			var plot = $('#plot :selected').text();
			if($('input[name=rating]:checked').val() === 'Yes'){
				var tomatoes = true;
			}else{
				var tomatoes = false;
			}
			console.log(t + i + type + y + plot + tomatoes);
			console.log(type);
			// console.log(tomatoes);

			$.ajax({
				url: 'http://www.omdbapi.com/?',
				data:{
					t: t,
					i: i,
					type: type,
					y: y,
					plot: plot,
					tomatoes: tomatoes,
					r: 'json'
				},
				type: 'GET',

				dataType: 'json',

				success:function(json){
					console.log(json);
				},
				error:function(xhr, status, errorThrown){
					console.log('there was an error!');
			        console.log( "Error: " + errorThrown );
    		    	console.log( "Status: " + status );
        			console.dir( xhr );
				},
				complete: function(){

				},
				beforeSend: function(){
					$('#ajaxContent').html('loading...');
				}
			});
		}

		event.preventDefault();
	});
});




