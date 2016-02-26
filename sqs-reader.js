exports.handler = function(event, context) {

var AWS = require('aws-sdk'),
	awsCredentialsPath = 'credentials.json',//файл для доступа(авторизации) к аккаунту
	sqsQueueUrl = '',//INFO: здесь указываем путь к используемому AWS-сервису (см. консоль AWS)
	sqs;

// Load credentials from local json file
AWS.config.loadFromPath(awsCredentialsPath);
// Instantiate SQS client
sqs = new AWS.SQS({apiVersion: '2012-11-05'});//.client;

var ses = new AWS.SES({apiVersion: '2010-12-01'});

    getNextMessage();

    function getNextMessage()
    {

			sqs.receiveMessage({
			   QueueUrl: sqsQueueUrl,
			   MaxNumberOfMessages: 10, // how many messages do we wanna retrieve?
			   VisibilityTimeout: 60, // seconds - how long we want a lock on this job
			   WaitTimeSeconds: 3 // seconds - how long should we wait for a message?
			 }, function(err, data) {
			   // If there are any messages to get
			   console.log("data",data.Messages,data);
			   if (data.Messages) {

			   	for(var i=0;i< data.Messages.length;i++)
			   	{
			      // Get the first message (should be the only one since we said to only get one above)
			      var message = data.Messages[i],
			          body = JSON.parse(message.Body);
			      // Now this is where you'd do something with this message
			      sendMail(body, message);  // whatever you wanna do
			      // Clean up after yourself... delete this message from the queue, so it's not executed again
			      // context.succeed("ok");  // Echo back the first key value
			   	}
			   }
			 });

			var removeFromQueue = function(message) {
			   sqs.deleteMessage({
			      QueueUrl: sqsQueueUrl,
			      ReceiptHandle: message.ReceiptHandle
			   }, function(err, data) {
			      // If we errored, tell us that we did
			      err && console.log(err);

			      if(data)
			      {
			      	getNextMessage();
			      }
			   });
			};


			function sendMail(body,message)
			{
				console.log("sendMail",body,message);

				var sbj = body.subject;
				var msg = body.body;
				var htmlMsg = body.htmlBody;
				var to = body.to;
				
				var params = {
				  Destination: { /* required */
				    ToAddresses: to,
				  },
				  Message: { /* required */
				    Body: { /* required */
				      Html: {
				        Data: htmlMsg /* required */
				      },
				      Text: {
				        Data: msg /* required */
				      }
				    },
				    Subject: { /* required */
				      Data: sbj /* required */
				    }
				  },
				  Source: 'info@orderguru.ru', /* required */
				  ReplyToAddresses: [
				    'info@orderguru.ru',
				    /* more items */
				  ]
				};

				ses.sendEmail(params, function(err, data) {
				  if (err) console.log(err, err.stack); // an error occurred
				  else
				  {
				    console.log(data);           // successful response
					removeFromQueue(message);  // We'll do this in a second
				  } 
				});

			}
	}


};

