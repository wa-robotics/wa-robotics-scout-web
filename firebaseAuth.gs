function test() {
  var handle = new cFireBase
    .FireBase()
    .generateJWT('https://wa-robotics-scout.firebaseio.com/',{uid:Session.getActiveUser().getEmail().replace(/\W/g,""), type:"regular"},'D1yxJQ2a7DN8aUaVcfxy2xpluNgUkQfhCqymLtvq');
    
    handle.put({ "name":"Evan","email":Session.getActiveUser().getEmail(),"orgs":{1:true} },'users/' + Session.getActiveUser().getEmail().replace(/\W/g,""));
}

function test3() {
 var tokenGenerator = new FirebaseTokenGenerator("D1yxJQ2a7DN8aUaVcfxy2xpluNgUkQfhCqymLtvq");
 var token = tokenGenerator.createToken({uid: Session.getActiveUser().getEmail()});
 return token;

}

function makeToken2(){ 
  var firebaseUrl = "https://wa-robotics-scout.firebaseio.com/"; 
  var secret = "D1yxJQ2a7DN8aUaVcfxy2xpluNgUkQfhCqymLtvq"; 
  var base = FirebaseApp.getDatabaseByUrl(firebaseUrl, secret); 
  return token; 
}