var five = require("johnny-five"),
    board = new five.Board();

board.on("ready", function() {
  led = new five.Led(13);

  servo = new five.Servo({
    pin: 10,
    range: [ 45, 135 ],
    type: "standard"
  });

  button = new five.Button(8);

  board.repl.inject({
    led: led,
    button: button,
    servo: servo
  });

  bumper = new five.Button(7);

  // led.strobe();

  button.on("down", function() {
    console.log("down");
    servo.move(60);
  });

  button.on("hold", function() {
    console.log("hold");
  });

  button.on("up", function() {
    servo.move(90);
    console.log("up");
  });

  bumper.on("hit", function() {
    servo.move(110);
    led.on();
    console.log("bump");

  }).on("release", function() {
    led.off();
    setTimeout(function() {
      servo.move(90);
    }, 300);

    console.log("release");

  });

  // servo.center();
  servo.move(90);

  servo.on("move", function( err, degrees ) {
    console.log( "move", degrees );
  });

});