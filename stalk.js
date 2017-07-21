const twitterKeys = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token_key: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET
}

const twilioClient = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
const twitterClient = require('twitter')(twitterKeys);

const fs = require('fs');
const moment = require('moment');

let delay; //initialize delay for api call

function sendSMS(tweet) {
    return new Promise((resolve, reject)=>{
        twilioClient.messages.create({
            to: process.env.PERSONALNUMBER,
            from: process.env.TWILIONUMBER,
            body: `Wes Bos just tweeted about stickers: ${tweet}`
        }, (err, msg)=> {
            if(err) {
                reject(err);
            } else {
                console.log(`SMS with id: ${msg.sid} sent at timestamp: ${moment.now()}`);
                resolve('success');
            }
        });
    })
}

function getLastTweetId() {

    function readLoggedTweets() {
        let arr = fs.readFileSync('tweetLog.json', 'utf-8');
        if (!arr) {
            return [];
        } else {
            return JSON.parse(arr);
        }
    }
    const tweets = readLoggedTweets();

    if (tweets.length) return tweets[0].id_str;
    else return 0;    
}

function stalkerEngine() {

    const lastTweetId = getLastTweetId();

    twitterClient.get('search/tweets', {q: 'from:wesbos -filter:retweets stickers', since_id: lastTweetId}, (err, tweets, response)=>{
        if (tweets.statuses) {
            if(tweets.statuses.length) {
                sendSMS(tweets.statuses[0].text).then(success=>{
                    const writableTweets = JSON.stringify(tweets.statuses, null, 5);
                    fs.writeFileSync('tweetLog.json', writableTweets, 'utf-8');
                }).catch(err=>{
                    console.error(err);
                });
            }
        }
    });
}

//initial call to start stalker
stalkerEngine();

//call stalker once every 5 minutes afterwards
delay = setInterval(stalkerEngine, 18000);