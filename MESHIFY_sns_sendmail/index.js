const AWS = require("aws-sdk");
const SNS = new AWS.SNS();

const AccountPrefix = "arn:aws:sns:"+process.env.AWS_REGION+":"+process.env.ACCOUNTID+":";
const topicNamePrefix = "mesh_";

exports.handler = (event, context,callback) => {
  console.log("event");
  console.log(JSON.stringify(event,null,2));

  let topicName = topicNamePrefix+event.target.replace(/(\,|\.|@|-)/g,"_");
  let topicArn = AccountPrefix + topicName;
  var params = {
    Message: event.body,
    Subject: event.subject.substring(0,99),
    TopicArn: topicArn
  };
  console.log("publishing");
  console.log(JSON.stringify(params,null,2));
  SNS.publish(params, function(err, data) {
    if (err){
      //check if topic exists
      if(err.message=='Topic does not exist' && err.code=='NotFound'){
        console.log("topic does not exist");
        var createTopic = {
          Name: topicName
        };
        SNS.createTopic(createTopic, function(err, data) {
          if (err) console.log(err, err.stack);
          else     console.log(data);
          //create subscription
          var createSubscription = {
            Protocol: 'email',
            TopicArn: topicArn,
            Endpoint: event.target
          };
          SNS.subscribe(createSubscription, function(err, data) {
            if (err) console.log(err, err.stack);
            else     console.log(data);
            console.log("publishing again");
            SNS.publish(params, function(err, data) {
              if (err){
                console.log(err, err.stack);
                callback(err);
              }else{
                console.log(data);
                callback(null,data);
              }
            });
          });

        });
      }else{
        console.log(err, err.stack);
        callback(err);
      }
    }else{
      console.log(data);
      callback(null,data);
    }
  });
}
