/**     A  S I M P L E   T W I T T E R   B O T           **/
/**     =======================================          **/
/**     Written by Amit Agarwal @labnol on 03/08/2013    **/
/**     Tutorial link: http://www.labnol.org/?p=27902    **/
/**     Live demo at http://twitter.com/DearAssistant    **/
/**                                                      **/
/**     Adapted by knb on    Mar 09, 2013                **/


function start() {
  
  // Delete exiting triggers, if any
  
  var triggers = ScriptApp.getScriptTriggers();
  
  for(var i=0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
    
  // Setup trigger to read Tweets every five minutes
  
  ScriptApp.newTrigger("fetchTweets")
           .timeBased()
           .everyMinutes(5)
           .create();
     
}

function oAuth() {

  var oauthConfig = UrlFetchApp.addOAuthService("twitter");
  oauthConfig.setAccessTokenUrl("https://api.twitter.com/oauth/access_token");
  oauthConfig.setRequestTokenUrl("https://api.twitter.com/oauth/request_token");
  oauthConfig.setAuthorizationUrl("https://api.twitter.com/oauth/authorize");
  oauthConfig.setConsumerKey(ScriptProperties.getProperty("TWITTER_CONSUMER_KEY"));
  oauthConfig.setConsumerSecret(ScriptProperties.getProperty("TWITTER_CONSUMER_SECRET"));
 
}

function fetchTweets() {

  oAuth();
  
  var twitter_handle = ScriptProperties.getProperty("TWITTER_HANDLE");
  
  var phrase = "lang:en+to:" + twitter_handle; //  English language tweets sent to @sudo_f
  var search = "https://api.twitter.com/1.1/search/tweets.json?count=5&include_entities=false&result_type=recent&q=";
  search = search + encodeString(phrase) + "&since_id=" + ScriptProperties.getProperty("SINCE_TWITTER_ID");    
      
  var options =
  {
    "method": "get",
    "oAuthServiceName":"twitter",
    "oAuthUseToken":"always"
  };
  
  try {

    var result = UrlFetchApp.fetch(search, options);    

    if (result.getResponseCode() === 200) {
      //Logger.log(result.getResponseCode());
      var data = Utilities.jsonParse(result.getContentText());
      //Logger.log(search);
      //Logger.log(data);
      if (data) {
        
        var tweets = data.statuses;
        //Logger.log(tweets);
        for (var i=tweets.length-1; i>=0; i--) {
          
          var question = tweets[i].text.replace(new RegExp("\@" + twitter_handle, "ig"), "");
          //Logger.log(question);
          var answer   = askWolframAlpha(question);
          
          sendTweet(tweets[i].user.screen_name, tweets[i].id_str, answer.substring(0,140));          
        }
      }
    }
    
  } catch (e) {
    Logger.log(e.toString());
  }
}

function sendTweet(user, reply_id, tweet) {

  var options =
  {
    "method": "POST",
    "oAuthServiceName":"twitter",
    "oAuthUseToken":"always"    
  };
  
  var status = "https://api.twitter.com/1.1/statuses/update.json";
  
  status = status + "?status=" + encodeString("@" + user + " " + tweet.substring(0,138));
  status = status + "&in_reply_to_status_id=" + reply_id;
  
  try {
    var result = UrlFetchApp.fetch(status, options);
    ScriptProperties.setProperty("SINCE_TWITTER_ID", reply_id);
    //Logger.log(status);    
    //Logger.log(result.getContentText());    
  }  
  catch (e) {
    Logger.log(e.toString());
  }
  
  
}

function askWolframAlpha(q) {
  var request  = "http://api.wolframalpha.com/v2/query?podindex=2&format=plaintext&appid=" 
                 + ScriptProperties.getProperty("WOLFRAM_API_ID") + "&input=" + encodeString(q);
  
  var answer = Xml.parse(UrlFetchApp.fetch(request).getContentText(), true);

  if (answer.queryresult.success == "true")   { 
    var ans = answer.queryresult.pod.subpod.plaintext.Text;
     //assume there's only one question mark in the string, at the end
    var rem = 130 - ans.length ;
    if (rem > 0){
      ans = ans + " Q: " + q.replace("?", "") + "?";
    }
    return ans.substring(0,138);
  } else {
    return "'" + q.substring(0,60).trim() + "' - Sorry but I do not have an answer to that question. Please try another one.";  
  }
}

// Thank you +Martin Hawksey - you are awesome

function encodeString (q) {
   var str =  encodeURIComponent(q);
   str = str.replace(/!/g,'%21');
   str = str.replace(/\*/g,'%2A');
   str = str.replace(/\(/g,'%28');
   str = str.replace(/\)/g,'%29');
   str = str.replace(/'/g,'%27');
   return str;
}

function clearLog() {
  Logger.clear();
}