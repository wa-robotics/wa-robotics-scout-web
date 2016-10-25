

function saveUserProperty_(key, value) {
  PropertiesService.getUserProperties().setProperty(key, value);
}

/*function test() {
  saveUserProperty("test","testing");
  Logger.log(getUserProperty("test"));
  saveUserProperty("test","new test");
  Logger.log(getUserProperty("test"));
  PropertiesService.getUserProperties().deleteProperty("test");
}*/


function getMatchInfoVexDb(sku) {
  sku = "RE-VRC-16-3279";
  var db = FirebaseApp.getDatabaseByUrl("https://wa-robotics-scout.firebaseio.com/",getFirebaseSecret_());
  
  var url = "http://api.vexdb.io/v1/get_matches?sku=" + sku;
  var results = UrlFetchApp.fetch(url).getContentText();
  var resultsParsed = JSON.parse(results);
  db.setData("/match_data/RE-VRC-123-123/",resultsParsed.result);
}

function getUserProperty_(key) {
  return PropertiesService.getUserProperties().getProperty(key);
}

function test_() {
 PropertiesService.getUserProperties().deleteProperty(getDefaultTeamPropertyName_());
 //Logger.log(saveDefaultTeam(""));
 //Logger.log(saveDefaultTeam("1900w"));
 //Logger.log(getDefaultTeamPropertyName_());
 Logger.log(getUserProperty_(getDefaultTeamPropertyName_()));
}



function checkAndroidParameter(e) {
  if (typeof e.parameter.fromandroidapp !== "undefined") { //if there's a parameter indicating that the request orginates from the Android app
    reqFromAndroidApp = true;
  } else {
    reqFromAndroidApp = false;
  }
}

//returns a string containing the user properties for a given user
function getDebugInfo(e) {
  var props = PropertiesService.getUserProperties().getKeys();
  var result = "";
  var value;
  props.forEach(function (val, index) {
    value = PropertiesService.getUserProperties().getProperty(val);
    result += val + " = " + value + " | ";
  });
  
  result += "User account used for authentication: " + Session.getActiveUser().getEmail();
  
  var instance = getUserProperty_("id");
  var instanceUrlParam = e.parameter.id;
  try {
    SpreadsheetApp.openById(instance).getEditors();
  } catch (e) {
    result += " | Error when verifying spreadsheet access for id saved in user property " + instance + ": " + e;
  }
  
  try {
    SpreadsheetApp.openById(instanceUrlParam).getEditors();
  } catch (e) {
    result += " | Error when verifying spreadsheet access for id supplied in url parameter " + instanceUrlParam + ": " + e;
  }
  
  return result;
  
}

function doGet(e) {
  //routing
  var page,
      match,
      showDifferentTeam = false;
  
  if (typeof e.parameter.id !== "undefined") {
    try {
       SpreadsheetApp.openById(e.parameter.id);
    } catch (e) {
    
    }
    
    if (!doNotSaveId) {
      saveUserProperty_("id",e.parameter.id);
      warsInstanceId = e.parameter.id;
    }
  } else {
     warsInstanceId = getUserProperty_("id");
  }
  var teamMemberTeamNum;
  switch(e.parameter.page) {
    case "main":
      page = "main";
      checkAndroidParameter(e);
      break;
    case "match":
      page = "match";
      match = e.parameter.match;
      checkAndroidParameter(e);
      break;
     case "team-search":
       page = "team-search";
       checkAndroidParameter(e);
      break;
     case "scouting-form":
       page = "scouting-form";
       checkAndroidParameter(e);
       break;
   default:
     page = "main";
     checkAndroidParameter(e);
  }
  
  var output;
  
  if (true) {
    if (page === "main"){
      output = HtmlService.createTemplateFromFile('index');
      output.teamMemberTeamNum = teamMemberTeamNum;
      output.reqFromAndroidApp = reqFromAndroidApp;
      //output.teamToLookUp = teamNum;
      //output.promptDefaultTeam = promptDefaultTeam;
      return output.evaluate()
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle("WA Robotics Scout Web")
            .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
            .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      } else if (page === "match") {
        output = HtmlService.createTemplateFromFile('matchInfo');
        output.team = teamNum;
        output.matchNum = match;
        output.teamMemberTeamNum = teamMemberTeamNum;
        output.reqFromAndroidApp = reqFromAndroidApp;
        output.teamToLookUp = teamNum;
        return output.evaluate()
                     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                     .setTitle("WA Robotics Scout Web")
                     .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
                     .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      } else if (page === "team-search") {
        output = HtmlService.createTemplateFromFile('teamSearch');
        
        output.teamMemberTeamNum = teamMemberTeamNum;
        output.reqFromAndroidApp = reqFromAndroidApp;
        return output.evaluate()
                     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                     .setTitle("WA Robotics Scout Web")
                     .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
                     .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      } else if (page === "scouting-form") {
        output = HtmlService.createTemplateFromFile('scoutingForm');
        
        output.teamMemberTeamNum = teamMemberTeamNum;
        output.reqFromAndroidApp = reqFromAndroidApp;
       
        output.teamToLookUp = teamNum;
        output.promptDefaultTeam = promptDefaultTeam;
        return output.evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setTitle("WA Robotics Scout Web")
              .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
              .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      }
      else if (page === "noData") {
        output = HtmlService.createTemplateFromFile('noData');
        return output.evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setTitle("WA Robotics Scout Web")
              .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
              .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      }
      else { //show not found (404 error) page
        output = HtmlService.createTemplateFromFile('notFound');
        return output.evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setTitle("WA Robotics Scout Web")
              .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
              .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
        }
      Logger.log(output.getCode());
  } 
  else {
    output = HtmlService.createTemplateFromFile('notAuthorized');
    if (e.parameter.debug) {
      output.debugString = getDebugInfo(e);
    } else {
      output.debugString = "";
    }
    return output.evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME)
      .setTitle("WA Robotics Scout Web")
      .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
      .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
  }
}