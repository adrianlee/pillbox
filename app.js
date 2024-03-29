////////////////////////////////////////////////
// Mongoose
////////////////////////////////////////////////
var mongoose = require('mongoose');
mongoose.connect('mongodb://pillbox:123123123@widmore.mongohq.com:10010/pillbox/');

var pillboxSchema = {
  name: 'string',
  age: 'string',
  email: 'string',
  phone: 'string',
  address: 'string',
  timestamp: { type: Date, default: Date.now }
};

var prescriptionSchema = {
  enable: { type:  Boolean },
  name: 'string',
  pillType: { type:  String },
  timestamp: 'string',
};


var logSchema = {
  pillbox_id: 'string',
  timestamp: { type: Date, default: Date.now },
  pill: { type:  String }
};

var Box = mongoose.model('Setting', mongoose.Schema(pillboxSchema));
var Prescription = mongoose.model('Prescription', mongoose.Schema(prescriptionSchema));
var Log = mongoose.model('Log', mongoose.Schema(logSchema));


////////////////////////////////////////////////
// Handlebars
////////////////////////////////////////////////
var hbs = require('hbs');
var blocks = {};

hbs.registerHelper('extend', function(name, context) {
  var block = blocks[name];
  if (!block) {
    block = blocks[name] = [];
  }

  block.push(context(this));
});

hbs.registerHelper('block', function(name) {
  var val = (blocks[name] || []).join('\n');

  // clear the block
  blocks[name] = [];
  return val;
});


////////////////////////////////////////////////
// Express Configuration
////////////////////////////////////////////////
var express = require('express'),
  app = express();

app.configure(function() {
  app.set('port', process.argv[2] || process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'hbs');
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'), {
    maxAge: 300000
  });
});

app.configure('development', function() {
  app.use(express.errorHandler());
});


// routes
app.get('/', function(req, res) {
  res.render('index');
});

// start http server
app.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});


////////////////////////////////////////////////
// Node Mailer
////////////////////////////////////////////////
var nodemailer = require("nodemailer");

var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: 'team@bojap.com',
    pass: 'bojap123'
  }
});

function sendMail() {
  var mailOptions = {
    from: "Pillbox",
    to: "adrian.lee@mail.mcgill.ca",
    subject: "John Doe's EasyMed Pillbox Summary",
    html: "<h3>EasyMed Summary for John Doe:</h3><br/>Dispensed: Despramine (Prescription-ID: 809QyCivcd) on " + new Date()
  };

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response) {
    if (error) {
      console.log(error);
    } else {
      console.log("Message sent: " + response.message);
    }
  });
}

////////////////////////////////////////////////
// Twilio
////////////////////////////////////////////////
var request = require("request");

function sendSMS() {
  var options = {
    method: "POST",
    url: "https://AC7114e975799243939dd159cc4ccab851:caede88e1eef8dac45a5fc0c191baf1d@api.twilio.com/2010-04-01/Accounts/AC7114e975799243939dd159cc4ccab851/SMS/Messages.json",
    form: {
      From: "+15148007107",
      To: "+15149659922",
      Body: "John Doe just dispensed: Despramine (Prescription-ID: 809QyCivcd)"
    }
  }

  request(options, function (err, r, b) {
    if (err) console.log(err);
    console.log(b);
  });
}



//////////////////////////////////////////////
// Johnny Five
//////////////////////////////////////////////
var five = require("johnny-five"),
  compulsive = require("compulsive"),
  board = new five.Board({ debug: true});

board.on("ready", function() {
  console.log('ready');

  var led = new five.Led(13);
  var bumper = new five.Button(7);
  var bumper_red = new five.Button(8);
  var servo = new five.Servo({
    pin: 10
  });
  var piezo = new five.Piezo(3);

  var angle = 90;
  var moving = false;

  servo.move(angle);
  led.on();

  function ring_increase() {
    var num = 5;
    compulsive.repeat(num, 200, function (r) {
      piezo.tone((num - r.repeat)*12345, 180);
    });
  }

  function beep(num) {
    this.num = num;
    compulsive.repeat(num, 2000, function () {
      piezo.tone(40, 700);
      // ring_increase();
    });
  }

  ring_increase();


  compulsive.wait(3000, function () {
    beep(2);
  })

  bumper.on("hold", function() {
    console.log("button press");
    if (!moving) {
      console.log('Dispense BLUE pill @ ' + new Date());
      piezo.tone(30, 500);
      moving = true;
      led.off();
      sendMail();

      compulsive.repeat(18, 10, function(t) {
        angle++;
        console.log(angle);
        servo.move(angle);
        if (!t.repeat) {
          compulsive.repeat(18, 10, function(t) {
            angle--;
            console.log(angle);
            servo.move(angle);
            if (!t.repeat) {
            }
          });
        }
      });
    }

    compulsive.wait(3000, function () {
      led.on();
      moving = false;
    })
  });

  bumper_red.on("hold", function() {
    console.log("button press");
    if (!moving) {
      console.log('Dispense RED pill @ ' + new Date());
      piezo.tone(30, 500);
      moving = true;
      led.off();
      sendSMS();

      compulsive.repeat(18, 10, function(t) {
        angle++;
        console.log(angle);
        servo.move(angle);
        if (!t.repeat) {
          compulsive.repeat(18, 10, function(t) {
            angle--;
            console.log(angle);
            servo.move(angle);
            if (!t.repeat) {
            }
          });
        }
      });
    }

    compulsive.wait(15000, function () {
      led.on();
      moving = false;
    })
  });

  bumper.on("release", function() {
    console.log('BLUE Button Released!');
  });

  bumper_red.on("release", function() {
    console.log('RED Button Released!');
  });
});