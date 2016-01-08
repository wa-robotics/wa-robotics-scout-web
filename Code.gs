function User (name, username, team, teamLeader) {
  this.name = name;
  this.username = username;
  this.team = team;
  this.teamLeader = teamLeader;
}

function doGet(e) {
  //routing
  var page;
  var match;
  var showDifferentTeam = false;
  var teamNum;
  var teamMemberTeamNum;
  switch(e.parameter.page) {
    case "main":
      page = "main";
      if (typeof e.parameter.team !== "undefined") { //if the team number parameter was given, use that team number
        teamNum = e.parameter.team.toUpperCase();
        showDifferentTeam = true;
      } else { //otherwise, use the team member's assigned team number
        teamNum = "";
        showDifferentTeam = false;
      }
      break;
    case "match":
      page = "match";
      match = e.parameter.match;
     if (typeof e.parameter.team !== "undefined") { //if the team number parameter was given, use that team number
        teamNum = e.parameter.team.toUpperCase();
        showDifferentTeam = true;
      } else { //otherwise, use the team member's assigned team number
        teamNum = "";
        showDifferentTeam = false;
      }
      break;
   default:
     page = "main";
     if (typeof e.parameter.team !== "undefined") { //if the team number parameter was given, use that team number
        teamNum = e.parameter.team.toUpperCase();
        showDifferentTeam = true;
      } else { //otherwise, use the team member's assigned team number
        teamNum = "";
        showDifferentTeam = false;
      }
  }
  
  var output;
  var authorized = true;
  //TO DO: authentication should ideally interface with WARS spreadsheet
  var exampleUser = new User ("name", "username", "team", false)
      authorizedUsers = [exampleUser];
      
  if (Session.getActiveUser().getEmail().indexOf("/*YOUR DOMAIN HERE*/") === -1) {
    authorized = false;
  } else {
    var userEmail = Session.getActiveUser().getEmail();
    var emailString;
    var foundEmail = false;
    var teamLeader = false;
    for (var i = 0; i < authorizedUsers.length; i++) {
      emailString = authorizedUsers[i].username + "/*YOUR DOMAIN HERE*/";
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
  
  }
  
  
  if (authorized) {
    if (page === "main"){
      output = HtmlService.createTemplateFromFile('index');
      output.userName = userName;
      output.teamLeader = teamLeader;
      output.teamMemberTeamNum = teamMemberTeamNum;
      Logger.log(teamNum);
      output.teamToLookUp = teamNum;
      return output.evaluate()
            .setSandboxMode(HtmlService.SandboxMode.IFRAME)
            .setTitle("WA Robotics Scout Web")
            .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
      } else if (page === "match") {
        output = HtmlService.createTemplateFromFile('matchInfo');
        output.userName = userName;
        output.teamLeader = teamLeader;
        output.team = teamNum;
        output.matchNum = match;
        output.teamMemberTeamNum = teamMemberTeamNum;
        return output.evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setTitle("WA Robotics Scout Web")
              .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
      } else { //show not found (404 error) page
        output = HtmlService.createTemplateFromFile('notFound');
        return output.evaluate()
              .setSandboxMode(HtmlService.SandboxMode.IFRAME)
              .setTitle("WA Robotics Scout Web")
              .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
        }
      Logger.log(output.getCode());
   } 
  else {
    output =  HtmlService.createTemplateFromFile('notAuthorized')
      .evaluate()
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
      output.setTitle("WA Robotics Scout Web")
            .addMetaTag("viewport", "width=device-width, initial-scale=1.0");
  }
  return output;
}
