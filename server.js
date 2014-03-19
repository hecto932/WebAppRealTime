//Express.js = Framework de node.js para crear aplicaciones web de manera sencilla
//Socket.io = Conexión con sockets para cada cliente con intereracción  en tiempo real
//Consolidate = Es el encargado del render de nuestros templates de frontend
//Swig  = Sistema de templates a utilizar
//Node-uuid: encargado de dar un id unico a cada tarea

var express = require('express'),
	
	app 		= express(),
	server 		= require('http').createServer(app),
	io			= require('socket.io').listen(server),
	swig		= require('swig'),
	cons		= require('consolidate'),
	uuid		= require('node-uuid'),
	ToDoTask	= [];

server.listen(3000);

console.log('visita http://localhost:3000 para ver el ToDo');

//Establecemos las propiedades de consolidate y swig, en donde primero quitamos el cache del swig cosa que solo hacemos en local pero despues en produccion lo activamos
swig.init({

	cache : false

});


//Aqui indicamos al engine que trabajar con consolidate para renderizar los templates de swig.
app.engine('.html', cons.swig);
app.set('view engine', 'html');

//Establecemos la carpeta estatica en donde tenemos todos los archivos css, javascript, depedencias, y el maravilloso y atractivo PonyExpress
app.use(express.static('./static'));

//Habilitamos las peticiones POST a nuestro server
app.use(express.bodyParser());

app.use(express.cookieParser());

app.use(express.methodOverride());

//Habilitamos una peticion .get a raiz de nuesto server indicando que el archivo .html se renderiza
app.get('/', function(req, res){

	res.render('index');

});

//Habilitamos una solicitud POST a /ToDoTask en donde mostraremos el JSON con la informacion que tomara PonyExpress para mosrtrar del lado del cliente
app.post('/ToDoTask', function(req, res){

	req.body.id = uuid.v1();
	
	console.log('body', req.body);

	ToDoTask.push(req.body);

	io.sockets.emit('ToDoList::create', req.body);

	res.send(200, { status: "ok" });

});

//Evento de eliminar un mensaje. Usaremos app.delete
app.delete('/ToDoTask/:id', function(){

	var ToDoList;

	for(var i = ToDoTask.lenght - 1; i >= 0; i--){

		ToDoList = ToDoTask[i];

		if(ToDoList.id === req.params.id){
			ToDoTask.splice(i,1);
		}
	}

	io.sockets.emit('ToDoList::delete', { id : req.params.id });

	res.send(200, { status: "ok" });

});

//Update para cada mensaje en donde lo que hacemos es un .put que es exactamente lo mismo que un .post solo que es utilizado por backbone hacia cada mensaje
app.put('/ToDoTask/:id', function(req, res){

	var ToDoList;

	for(var i = ToDoTask.lenght - 1; i >= 0; i--){
		ToDoList = ToDoTask[i];

		if(ToDoList.id === req.params.id){
			ToDoTask[i] = req.body;
		}
	}

	io.sockets.emit('ToDoList::update', req.body);

	res.send(200, { status: "ok" });

});

/* GET a ToDoTask */
app.get('/ToDoTask', function (req, res) {
	res.send(ToDoTask);
});


/* Establece eventos create delete y update para cada mensaje en cada socket */
var connection = function(socket){		
	socket.on('ToDoList::create', function(data){
		ToDoTask.push(data);

		socket.broadcast.emit('ToDoList::create', data);
	});

	socket.on('ToDoList::delete', function(data){
		socket.broadcast.emit('ToDoList::delete', data);
	});

	socket.on('ToDoList::update', function(data){
		socket.broadcast.emit('ToDoList::update', data);
	});
}

io.sockets.on('connection', connection);