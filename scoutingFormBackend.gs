/**
* Function duplicated from WARS Google Sheets add-on backend to interface with the data storage spreadsheet for the WARS instance being used
* Create a new database for data storage.  Database sheets automaticaly have edit warnings enabled.
* @param db_name The name of the database
* @param if_not_exist Only create the database if one with that name doesn't already exist (note - this checks by name, not by columns, because two databases cannot have the same name, no matter what)
* @param columns Array of column names for the database
*/
function createDatabase_(dbName, ifNotExist, columns, spreadsheetID) { 
  var ss,
      useID = false;
      Logger.log(spreadsheetID);
  if (spreadsheetID) {
    try {
      ss = SpreadsheetApp.openById(spreadsheetID);
    } catch(e) {
      return {error: { code: 200, message: "Couldn't get spreadsheet with ID specified because of an error: " + e }};
    }
    useID = true; //this will only run if there was no error and the return statement wasn't called
  }
  
  ss = (!useID) ? SpreadsheetApp.getActiveSpreadsheet() : ss; //if no spreadsheet ID was specified, 
  
  var create = true;
  if (ifNotExist) { //if we need to check if the sheet exists
    var sheets = ss.getSheets();
    if (sheets.length >= 1) {
      for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getSheetName() === dbName) {
          create = false; //if a sheet with the name given is found, don't create a new database
          break; //stop looping because we found a duplicate
        }
      }
    }
  }
  if (create) {
    ss.insertSheet(dbName);
    var sheet = ss.getSheetByName(dbName);
    sheet.protect().setWarningOnly(true).setDescription("WA Robotics Scout internal database"); //add protection against inadvertant changes to the database
    sheet.appendRow(columns);
  }
}

function checkboxToString_(checkboxes) {
  var autonActions = ["Scored star in near or far zone","Scored cube in near or far zone","Knocked star(s) off fence","Hung high","Hung low"];
  var robotTypes = ["Catapult","Dumper"];
  var stem = "",
      checkboxValsArray = [],
      str = "",
      result = [];
  Logger.log(checkboxes);
  for (id in checkboxes) {
    checkboxValsArray.push({"id": id, "val":checkboxes[id]});
  }
  
  checkboxValsArray.sort(function(a,b) {
    if (a.id > b.id) {
      return 1;
    } else if (a.id < b.id) {
      return -1;
    }
    return 0;
  });
  Logger.log(checkboxValsArray);
  
  var id, value, 
      currGroupIndex = 0;
  stem = checkboxValsArray[0].id.substring(0,id.indexOf("-") + 1);
  for (var i = 0; i < checkboxValsArray.length; i++) {
      id = checkboxValsArray[i].id;
      Logger.log(id.substring(0,id.indexOf("-") + 1))
      if (id.substring(0,id.indexOf("-") + 1) !== stem) {
        Logger.log("new stem");
        stem = id.substring(0,id.indexOf("-") + 1);
        result[currGroupIndex] = [str.substring(0,str.length-2)];
        currGroupIndex++; //increment current group index now that we've added the old one to the array
        str = "";
      }
      str += checkboxValsArray[i].val + ", ";
      Logger.log(str);
      Logger.log(checkboxValsArray);
  }   
  
  result[currGroupIndex] = [str.substring(0,str.length-2)];
  Logger.log(result);
  return result;
}

/*
  Returns the time in seconds between time1 and time2
*/
function getSecondsBetween_(time1, time2) {
  return (new Date(Math.abs(time1 - time2)).getTime())/1000;
}

function saveResponses_(r) {
  spreadsheetID = getUserProperty_("id");
  if (!spreadsheetID) {
    throw "Unable to retrieve spreadsheet ID";
  }
  createDatabase_("DB_SCOUTING_FORM_RESPONSES",true, ["timestamp","match","team","alliance","autonstarttime","autonpointsscored","autonactions", "robottype",
                                                      "strafes","scoredobjects","dchangstart","dchangend","dchangtime","dchangresult","dchangassistance"],spreadsheetID);
  var autonPlayStart,
      dcHangDuration,
      dcHangStart,
      dcHangEnd;
      
  try {
    if (r.text["other-team-num"] !== "") {
      r.meta.team = r.text["other-team-num"].toUpperCase();
    }
  } catch (e) {
    Logger.log(e);
  }
  
  try {
    if (r.text["manual-match-num"] !== "") {
      r.meta.match = "Q" + r.text["manual-match-num"];
    }
  } catch (e) {
    Logger.log(e);
  }


  //autonStart is when the autonomous period starts
  //auton-start-time is the marked time (result of pressing "Mark time" button) for when the autonomous period starts
  if (r.markedTimes["auton-start-time"] !== "") {
    autonPlayStart = 15 - getSecondsBetween_(parseInt(r.markedTimes["autonStart"]),parseInt(r.markedTimes["auton-start-time"]));
  } else if (parseInt(r.text["auton-play-start-time"]) >= 0 && parseInt(r.text["auton-play-start-time"]) <= 15) {
    autonPlayStart = parseInt(r.text["auton-play-start-time"]);
  } else {
    autonPlayStart = "unknown";
  }
  
  if (r.markedTimes["dc-hang-start"] !== "") {
    dcHangStart = 105 - getSecondsBetween_(parseInt(r.markedTimes["driverStart"]),parseInt(r.markedTimes["dc-hang-start"]));
  } else if (parseInt(r.text["dc-hang-start-time"]) >= 0 && parseInt(r.text["dc-hang-start-time"]) <= 105) {
    dcHangStart = parseInt(r.text["dc-hang-start-time"]);
  } else {
    dcHangStart = "unknown";
  }
  
  if (r.markedTimes["dc-hang-end"] !== "") {
    dcHangEnd = 105 - getSecondsBetween_(parseInt(r.markedTimes["driverStart"]),parseInt(r.markedTimes["dc-hang-end"]));
  } else if (parseInt(r.text["dc-hang-end-time"]) >= 0 && parseInt(r.text["dc-hang-end-time"]) <= 105) {
    dcHangEnd = parseInt(r.text["dc-hang-end-time"]);
  } else {
    dcHangEnd = "unknown";
  }
  
  if (dcHangStart > dcHangEnd) {
    dcHangDuration = dcHangStart - dcHangEnd
  } else {
    dcHangDuration = "Unknown (hang start time was later than end time)";
  }

  var checkboxStrings = checkboxToString_(r.checkbox);
  var ss = SpreadsheetApp.openById(spreadsheetID);
  var rowContents = [Date(),r.meta.match,r.meta.team,r.meta.alliance, autonPlayStart,r.text["auton-pts-scored"],checkboxStrings[0].toString(),checkboxStrings[1].toString(),
                     r.radio["robot-strafes"],JSON.stringify(r.scoredObjs),dcHangStart, dcHangEnd, dcHangDuration, r.radio["driver-hang-result"], r.radio["hang-assistance"]];
  ss.getSheetByName("DB_SCOUTING_FORM_RESPONSES").appendRow(rowContents);
  
}

function submitResponses(formAnswers) {
  try {
    saveResponses_(formAnswers);
  } catch (error) {
    throw error.toString();
  }
  return formAnswers;
}