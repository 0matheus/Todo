//Escapa os caracteres para evitar uma injeção de código malicioso
function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function liEscapedContentElement(message) {
  return $('<div></div>').html('<input type=\'checkbox\' name=\'chk\'></input>'+'<label>'+message+'</label>');
}
//Retorna uma mensagem contida em uma div específica
function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

//Verifica o input do usuário e toma a ação desejada
function processUserInput(chatApp, socket) {
  var message = $('#send-message').val();
  var autor = $('#autor').val();
  var prioridade = $('#prioridade').val();
  var data = $('#data').val();
  var systemMessage;

  // O input corresponde a um comando
  if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);
    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else { //O input corresponde a uma mensagem
    chatApp.sendMessage($('#room').text, message, autor, prioridade, data, false);
    // $('#messages').append($('<input type=\'checkbox\'></input>'));
    $('#messages').append(liEscapedContentElement(message+autor+prioridade+data));
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
  $('#autor').val('');
  $('#prioridade').val('');
  $('#data').val('');
}

//Estabelece a conexão ao servidor
var socket = io.connect();

$(document).ready(function() {
  //Cria uma instância de chat no lado cliente
  var chatApp = new Chat(socket);

  //Lida com o evento nameResult, que contém o resultado da tentativa
  //De mudança de nome
  socket.on('nameResult', function(result) {
    var message;

    if (result.success) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }
    //Insere a mensagem na tela
    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('mensagens', function(mensagens){
    for(var mensagem in mensagens){
      // $('#messages').append($('<input type=\'checkbox\'></input>'));
      $('#messages').append(liEscapedContentElement(mensagens[mensagem].text+mensagens[mensagem].autor));
    }
  });

  //Lida com o evento joinresult, que recebe o resultado de
  //uma mudança de sala
  // socket.on('joinResult', function(result) {
  //   //Muda o nome da sala
  //   $('#room').text(result.room);
  //   //Insere a mensagem de que a sala foi alterada
  //   $('#messages').append(divSystemContentElement('Room changed.'));
  // });

  //Lida com o evento message
  socket.on('message', function (message) {
    //Imprime a mensagem na tela
    // var newElement = $('<div></div>').text(message.autor);
    // var newElement = $('<div></div>').html(
    //   '<div>' 
    //     + message.text + message.autor + message.data  + message.prioridade + 
    //   '</div>');
    // var newElement = $('<li></li>').text(message.text + message.autor + message.data + message.prioridade);
    $('#messages').append(liEscapedContentElement(message.text+message.autor+message.prioridade+message.data));
  });

  //Lida com as salas disponíveis
  socket.on('rooms', function(rooms) {
    $('#room-list').empty();

    //Varre as salas disponíveis e as imprime na tela
    for(var room in rooms) {
      room = room.substring(1, room.length);
      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    // Ao clicar no nome de uma sala, executa-se um join
    $('#room-list div').click(function() {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  // Função que periodicamente emite o evento rooms ao servidor, requisitando
  // as salas disponíveis
  setInterval(function() {
    socket.emit('rooms');
  }, 1000);

  //Cria efeito de focus na caixa de mensagens
  $('#send-message').focus();


  $('#messages').change(function(){
    // alert('messages changed');
    var $boxes = $('#messages input[name="chk"]:checked');
    $boxes.each(function(){
        $(this).parent().remove();
      });
  });

  //Submete a entrada de usuário ao tratador de input
  $('#send-form').submit(function() {
    processUserInput(chatApp, socket);
    return false;
  });
});
