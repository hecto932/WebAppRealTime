window.ponyExpress = new PonyExpress({

	io : 'http://localhost:3000'

});

window.ToDoTaskModel = Backbone.Model.extend({

	urlRoot : '/ToDoTask'

});

window.ToDoTaskCollection = Backbone.Collection.extend({

	name	: 'ToDoList',
	model 	: window.ToDoTaskModel

});

//Creamos una lista de colecciones en base a las de backbone
window.ToDoListCollection = new ToDoTaskCollection();

//Esta funcion sera la disparada en cada evento y generara un emit socket io
//Se encargara de de mandar el evento a todos los navegadores
window.ponyExpress.bind('connect', function(){

	var xhrToDoTasks = $.get('/ToDoTask');

	xhrToDoTasks.done(function(data){

		window.ToDoListCollection.add(data);

		window.ToDoListPlug = new PonyExpress.BackbonePlug({

			collection : window.ToDoListCollection

		});

	});

});

$(document).ready(function(){

	window.ToDoView = Backbone.View.extend({

		tpl 	: _.template( $('#AgregarTask').html() ),
		events 	: {
			"click #submit" : "send"
		},
		initialize : function (config){

			var todoView = this;

			this.$el = this.targetElement || this.$el;

			this.el = this.$el[0];

			this.render();

			this.$el.appendTo('#Tasks');

			window.ToDoListCollection.on('add', function(ToDoListModel){

				var ToDoListView = new ToDoTaskView({

					model 	: ToDoListModel,
					id		: 'tarea-' + ToDoListModel.id

				});

				if(ToDoListModel.get('TaskStatus')){

					ToDoListView.$el.prependTo( todoView.$el.find('.TaskComplete') );

				}else{

					ToDoListView.$el.prependTo( todoView.$el.find('.TaskIncomplete') );

				}

			});

		},
		send : function (){

			var user = this.$el.find('#user').val(),

				text = this.$el.find('#text').val();

			if( !user || !text ){

				return;

			}

			var model = new ToDoTaskModel( { user : user, text : text } );

			model.save();

			this.$el.find('#text').val('');

		},
		render : function(){

			this.$el.html( this.tpl({}) );

		}


	});
	
	window.ToDoTaskView = Backbone.View.extend({

		tpl 	: _.template( $('#ToDoList-template').html() ),

		events 	: {

			'click .highlight' 	: 'highlightHandler',
			'click .remove'		: 'removeHandler'
		},
		initialize : function(config)
		{
			var ToDoListView = this;
			
			this.render();

			this.model.on('change', function(){

				ToDoListView.render();

			});

			this.destroyHandler = function(){

				console.log('destroying', this.toJSON() );

				ToDoListView.remove();

			}

			this.model.on('destroy', this.destroyHandler);

			return this;

		},
		highlightHandler : function(){

			if(this.model.get('TaskStatus')){

				this.model.set('TaskStatus', false);

			}else{

				this.model.set('TaskStatus', true);

			}

			this.model.save();

			this.render();

		},
		removeHandler : function(){

			this.model.off('destroy', this.destroyHandler);

			this.model.destroy();

			this.remove();

		},
		render : function(){

			this.$el.html( this.tpl( this.model.toJSON() ) );

			if(this.model.get('TaskStatus')){

				this.$el.addClass('highlighted');

				this.$el.appendTo('.TaskComplete');

			}else{

				this.$el.removeClass('highlighted');
				this.$el.appendTo('.TaskIncomplete');

			}

		}

	});

	window.tareas = new window.ToDoView({
		targetElement : $('#Tasks')
	});
	$('#text').keyup(function(data){
		if (data.keyCode == 13){
			$('#submit').click();
		}
	});
	$('#all').on('click',function(){
		$('.TaskComplete').show();
		$('.TaskIncomplete').show();
	});
	$('#complete').on('click',function(){
		$('.TaskComplete').show();
		$('.TaskIncomplete').hide();
	});
	$('#incomplete').on('click',function(){
		$('.TaskIncomplete').show();
		$('.TaskComplete').hide();
	});
	$('.write').on('click',function(){
		$('.TaskIncomplete').find('.highlight').click();
	});

});