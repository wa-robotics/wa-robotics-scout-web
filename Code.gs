function User (name, username, team, teamLeader) {
  this.name = name;
  this.username = username;
  this.team = team;
  this.teamLeader = teamLeader;
}

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

function getMatchInfoVexDb() {
  var db = FirebaseApp.getDatabaseByUrl("https://wa-robotics-scout.firebaseio.com/");
  
  
  
  db.setData("/match_data/RE-VRC-123-123/0/redscore","23");
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

/**
* Returns the property name in UserProperties to get the property key needed to retrieve the user's default team for a specific WARS instance
*/
function getDefaultTeamPropertyName_() {
  return "defaultTeam-" + getUserProperty_("id"); 
}

function checkDefaultTeam() {
  Logger.log(getDefaultTeamPropertyName_());
  Logger.log(getUserProperty_("id"));
  if(getUserProperty_(getDefaultTeamPropertyName_())) {
    return true;
  } else {
    return false;
  }
}
function saveDefaultTeam(team) {
  var propertyName = getDefaultTeamPropertyName_(); ////since WARS Web only requests a default team if the user has been authorized successfully, we know that the user will have a valid spreadsheet ID already in their user properties (because that's how WARS Web authenticated the user)
  
  if (!team) {
    return false;
  }
  
  if (team.length > 0 && team.length <= 6) { //as of May 2015, the longest team numbers are 6 characters.  Given the number of possibilites this allows for, this probably won't be changing anytime soon. 4-May-2016
    //validate team numbers to make sure they are the proper length and that a team number was actually provided
    saveUserProperty_(propertyName, team.toUpperCase());
    return true;
  } else {
   return false;
  }
}

function getDefaultTeamNumber() {
  var userProps = PropertiesService.getUserProperties(),
      propKeys = userProps.getKeys(),
      propertyName = getDefaultTeamPropertyName_();
      
  for (var i = 0; i < propKeys.length; i++) {
    if (propKeys[i] === propertyName) {
      return getUserProperty_(propertyName);
    }
  }
  return ""; //if the for loop doesn't find the defaultTeam property, return a blank string to indicate that the user has no default team set
}


var teamNum, //these are used in functions other than doGet, so they need to be global
    teamMemberTeamNum,
    reqFromAndroidApp,
    promptDefaultTeam = "false"; //having this as a string makes things simpler when this variable is used in a printing scriptlet in index.html, where the value gets turned into a string (by the printing scriptlet) anyways;

function checkTeamParameter(e) {
  var defaultTeam = getDefaultTeamNumber();
  if (typeof e.parameter.team !== "undefined") { //if the team number parameter was given, use that team number
    teamNum = e.parameter.team.toUpperCase();
    showDifferentTeam = true;
  } else { //otherwise, use the team member's default team number
    teamNum = defaultTeam;
    showDifferentTeam = false;
    if (teamNum === "") {
       promptDefaultTeam = "true"; //see initialization of this variable for why this is a string and not a boolean
    }
  }  
  teamMemberTeamNum = defaultTeam; //assume that the user's team is always whatever they have set as their default, but only prompt (see promptDefaultTeam, above) to set a default team if WARS needs it in order to show information
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
      showDifferentTeam = false,
      sidGiven = false,
      sid,
      doNotSaveId = false,
      warsInstanceId;
  
  if (typeof e.parameter.id !== "undefined") {
    try {
       SpreadsheetApp.openById(e.parameter.id); //"1vrZQpvtiJvcyKdlULZk5HOyRU5ystAiMZ4y8rF6dJEg"
    } catch (e) {
    
    }
    
    if (!doNotSaveId) {
      saveUserProperty_("id",e.parameter.id);
      warsInstanceId = e.parameter.id;
    }
  } else {
     warsInstanceId = getUserProperty_("id");
  }
  
  switch(e.parameter.page) {
    case "main":
      page = "main";
      checkTeamParameter(e);
      checkAndroidParameter(e);
      break;
    case "match":
      page = "match";
      match = e.parameter.match;
      checkTeamParameter(e);
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
     checkTeamParameter(e);
     checkAndroidParameter(e);
  }
  
  var output;
  var authorized = true;
  
  try {
    authorizedUsers = SpreadsheetApp.openById(warsInstanceId).getEditors();
    authorized = true;
  } catch (e) {
    authorized = false;
    page = "noData";
  }
  
  userName = "";
  teamLeader = false;
/*if (page !== "noData"){
  for (var i = 0; i < authorizedUsers.length; i++) {
    if(authorizedUsers[i].getEmail() === Session.getActiveUser().getEmail()) {
      authorized = true;
      break;
    }
  }
  }*/
/*
  //TO DO: authentication should ideally interface with WARS spreadsheet
  var evan = new User('Evan', '17estrat',"1900W",false),
      alex = new User("Alex", "17adulisse", "1900W", false),
      crawford = new User('Crawford', '17ckennedy',"1900W",false),
      hipp = new User('Mr. Hipp', 'tim.hipp',"1900W", false),
      cameron = new User('Cameron', '18ckriegel',"1900W", false),
      brandon = new User('Brandon', '16bsnapperman',"1900W", false),
      wyatta = new User('Wyatt', '17watchison',"1900W", false),
      wyattj = new User('Wyatt','19wjohnson','1900W',false),
      yari = new User('Yari', '16ymosley',"1900W", false),
      marc = new User('Marc', '18mhammond',"1900W", false),
      faiz = new User('Faiz', '18fessa',"1900W", false),
      gibran = new User('Gibran', '17gessa',"1900W", false),
      prasanth = new User('Prasanth', '18pgudur',"1900W", false),
      kia = new User('Kia Jie', '17kjacobs',"1900W", false),
      jeremy = new User('Jeremy', '17jkopelman',"1900W", false),
      allen = new User('Allen', '16ahulette', "1900W", false),
      authorizedUsers = [evan, alex, crawford, hipp, cameron, brandon,
                         wyatta, wyattj, yari, marc, faiz, gibran, prasanth,
                         kia, jeremy, allen];
      
  if (Session.getActiveUser().getEmail().indexOf("@woodward.edu") === -1) {
    authorized = false;
  } else {
    var userEmail = Session.getActiveUser().getEmail();
    var emailString;
    var foundEmail = false;
    var teamLeader = false;
    for (var i = 0; i < authorizedUsers.length; i++) {
      emailString = authorizedUsers[i].username + "@woodward.edu";
      if (emailString === userEmail) {
        foundEmail = true;
        var teamLeader = authorizedUsers[i].teamLeader,
            userName = authorizedUsers[i].name;
        if (!showDifferentTeam) { //if the user isn't requesting data about a team other than their own (assuming they are associated with a team)
          teamNum = authorizedUsers[i].team;
        }
          teamMemberTeamNum = authorizedUsers[i].team;
        Logger.log(teamNum);
      }
    }
    if(!foundEmail) { //if the user's email isn't recognized in the list of approved email addresses
      authorized = false;
    }
  
  }*/
  
  
  if (authorized) {
    if (page === "main"){
      output = HtmlService.createTemplateFromFile('index');
      output.userName = userName;
      output.teamLeader = teamLeader;
      output.teamMemberTeamNum = teamMemberTeamNum;
      output.reqFromAndroidApp = reqFromAndroidApp;
      output.instanceID = warsInstanceId;
      output.teamToLookUp = teamNum;
      output.promptDefaultTeam = promptDefaultTeam;
      return output.evaluate()
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle("WA Robotics Scout Web")
            .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
            .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      } else if (page === "match") {
        output = HtmlService.createTemplateFromFile('matchInfo');
        output.userName = userName;
        output.teamLeader = teamLeader;
        output.team = teamNum;
        output.matchNum = match;
        output.instanceID = warsInstanceId;
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
        output.userName = userName;
        output.teamLeader = teamLeader;
        output.teamMemberTeamNum = teamMemberTeamNum;
        output.instanceID = warsInstanceId;
        output.reqFromAndroidApp = reqFromAndroidApp;
        return output.evaluate()
                     .setSandboxMode(HtmlService.SandboxMode.IFRAME)
                     .setTitle("WA Robotics Scout Web")
                     .addMetaTag("viewport", "width=device-width, initial-scale=1.0")
                     .setFaviconUrl("https://wa-robotics-scout-web-assets.firebaseapp.com/favicon.ico");
      } else if (page === "scouting-form") {
        output = HtmlService.createTemplateFromFile('scoutingForm');
        output.userName = userName;
        output.teamLeader = teamLeader;
        output.teamMemberTeamNum = teamMemberTeamNum;
        output.reqFromAndroidApp = reqFromAndroidApp;
        output.instanceID = warsInstanceId;
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