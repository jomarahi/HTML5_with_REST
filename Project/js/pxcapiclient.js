var baseurl = "https://192.168.1.10/"
var pathPrefix = "Arp.Plc.Eclr/";
var Token = "";
var BearerToken ="";
var GroupID = "";
// replace with your list of variables (or even better:  load from .JSON file )
var variables = ["PLC_SYS_TICK_CNT","Integer1","Integer2","Boolean1","Boolean2","Real1","Real2","Array1[0]","Array1[1]","Struct1.Field1","Struct1.Field2"]
var dataPollIntervalMsecs = 100; // data poll every 250ms
// knockout will bind to this. Set it up to bind to the same fields that are contained in the response
var groupDataValues = [{prefix: "Arp.", path: "dummytag", value: "dummyvalue" }];

// This is the definition of our ViewModel class.
// ko will inspect this object and set up bindings with the HTML DOM when ko.applyBindings occurs
function AppViewModel() {
    var self = this;
    self.hmitags = ko.observableArray(groupDataValues);
    self.dispDate = ko.observable('Today');
    self.dispTime = ko.observable('99:99');
    self.VarName = ko.observable("Integer1");
    self.ConstantValue = ko.observable("2152");
    self.availableVariables = [ "Integer2",  "Boolean2",  "Real2",  "Array1[1]","Struct1.Field2"];
}

var viewModel = new AppViewModel();

function startData() {
    api.registerGroup(
        pathPrefix,
        variables
        ).then((group) => {
                console.log("group registered. Setting up data polling.")
                    setInterval(function timercallback() {
                    UpdateDateTime();
                    setInterval(UpdateDateTime, 500);
                    GroupID = group.id;
                    api.getGroup(group.id);

                    //api.getGroup(group.id).then((groupdata) => {
                        // update the fields with the data values
                    //    processGroupData(groupdata);
                    //});
                },
                dataPollIntervalMsecs);
            }
        );
    ko.applyBindings(viewModel);
}

var authorizeButton;
var signoutButton;
var usernameField;
var passwordField;

function handleClientLoad() {
    initialize(baseurl);
    api.loadAuth();
    authorizeButton = document.getElementById('authorize-button');
    signoutButton = document.getElementById('signout-button');
    usernameField = document.getElementById('username');
    passwordField = document.getElementById('password');
    authorizeButton.onclick = handleAuthClick;
    //signoutButton.onclick = handleSignoutClick;
    updateSigninStatus(false);
}

function handleAuthClick() {
    console.log("authenticating");
    api.auth.signIn(usernameField.value, passwordField.value).then(() => {
        console.log("authentication succeeded");
        updateSigninStatus(true);
        startData();
    }).catch(() => {
        console.log("authentication failed");
    });
}

function updateSigninStatus(isSignedIn) {
  //Blendet Buttons ein und aus
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

function Write()
{
  var writeData = {"pathPrefix": "Arp.Plc.Eclr/", "variables": [ { "path": viewModel.VarName(), "value": viewModel.ConstantValue(), "valueType": "Constant" } ]};
  $.ajaxSetup({
    beforeSend: function(xhr) {
        xhr.setRequestHeader('Authorization', 'Bearer ' + BearerToken);
    }
  });
	$.ajax({
    type: "PUT",
    url: baseurl+"_pxc_api/api/variables/",
	  data: JSON.stringify(writeData),
	  dataType: "json"
})
    .done(function(data, status, jqXHR){
        console.log("Success Write:" +writeData)
    })
    .fail(function(jqXHR, status, errorThrownthrown){
        console.log("Write Error: " + errorThrownthrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		alert( "Write $.ajax failed.  Status: " + status);
    });
}

// pull the data out of the group response object and feed it to the bindings in knockout
function processGroupData(data) {
    groupDataValues.length = 0; // get rid of data from last query
   // use data.variables from the response JSON object to update the view models. Knockout will update the UI automatically
    var prefix = data.pathPrefix;
    $.each(data.variables, function () {
        // add it to the ko observable array named groupDataValues that is in the viewmodel
        viewModel.hmitags.push
                  ({
                    prefix: ko.observable(data.variablePathPrefix),
                    path:   ko.observable(this.path),
                    value:  ko.observable(this.value)
                  })
    });
}

var registerGroupSuccessStatus = 201;
var requestGroupSuccessStatus = 200;

// in order to authenticate, the user must have EHmiViewer or EHmiChanger roles
// Optionally, the user can have one or more of the EhmiLevel1 to EhmiLevel10 roles. These will be present in the roles array if they are configured.
class AuthenticatedUser {
  constructor(){
    username = "";
    roles = []; // array of roles (EhmiLevel1 to EhmiLevel10). These are configured in web based management.
  }
}

// Request a temporary token in order to authenticate. This is used to protect against replay attacks.
class AuthorizationReqest {
  constructor(){
    this.uri = "_pxc_api/auth/auth-token";
    this.mysecret = "myappsecret"; // For demo purposes only. This should be some random bit of data to ensure response is to our request
  }
    makeReqeuest(xhr, baseurl) {
        return new Promise((resolve, reject) => {
            var dest = baseurl + this.uri;
            console.log("destination for auth token request is " + dest);
            xhr.open("POST", dest);
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            var secret = this.mysecret;
            xhr.onload = function authorizationTokenCallback() {
            if (this.status === 200) {
              var authresponse = JSON.parse(this.responseText);
              if (authresponse.code) {
                // check our secret
                if (authresponse.state === secret) {
                  console.log("obtained authentication token: " + authresponse.code)
                  resolve(authresponse.code);
                } else {
                  reject({
                      status: 0,
                      statusText: "server did not response with expected state value " + authresponse.code
                  });
                }
            } else {
                console.log("code missing from response: " + this.response);
                reject({
                    status: this.status,
                    statusText: this.statusText
                });
            }
            } else {
                reject({
                    status: this.status,
                    statusText: this.statusText
                    });
                }
          };
            // request token allowing authentication to the variables application scope
            var authData = {
                response_type: "code",
                state: this.mysecret,
                scope: "variables"
            };
            console.log("Sending auth token request" );
            xhr.send(JSON.stringify(authData));
        });
    }
}

// request access to a protected resource
class AccessRequest {
  constructor()
  {
    this.uri = '_pxc_api/auth/access-token';
  }
    makeRequest(xhr, baseurl, authToken, userName, password) {
        return new Promise((resolve, reject) => {
            console.log("generating access request for " + baseurl + this.uri);
            xhr.open("POST", baseurl + this.uri);
            xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            var messagedata = {
                code: authToken,
                grant_type: "authorization_code",
                username: userName,
                password: password
            };
            xhr.onload = function accessRequestCallback() {
                var accessResponse = JSON.parse(this.responseText);
                if (this.status === 200 && accessResponse) {
                    console.log("Authenticated");
                    resolve(accessResponse.access_token);
                } else {
                    var rejectData = {
                        status: this.status,
                        statusText: this.statusText,
                        badToken: false,
                        badCredentials: false
                    };
                    if (this.status === 401) {
                        var headererror = this.getResponseHeader('WWW-Authenticate');

                        if (headererror) {
                            if (headererror.search("invalid_token") !== -1) {
                                console.log("bad authorization token")
                                rejectData.badToken = true;
                            } else if (headererror.search("invalid_grant") !== -1) {
                                console.log("bad credentials");
                                rejectData.badCredentials = true;
                            }
                        }
                    }
                    reject(rejectData);
                }
            };
            xhr.send(JSON.stringify(messagedata));
        });
    }
}

// lightweight OAuth 2.0 subset object
class Auth2 {
    constructor(baseurl) {
        this.baseurl = baseurl; // plc address
        this.authorizationToken = null; // token required to authenticate
        this.accessToken = null;        // token you receive once you have authenticated that grants access to protected resources
        this.currentuser = null;
    }

    init() {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest()
            var  authRequest = new AuthorizationReqest();
            authRequest.makeReqeuest(xhr, this.baseurl).then((authToken) => {
                console.log("have auth token");
                this.authorizationToken = authToken; // save the token so that authentication with username/password is possible
                resolve(authToken);
            }).catch((status) => {
                console.log("Unable to get authorization token: " + status.statusText);
                reject(status);
            });
        });
    }
  signIn(username, password) {
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest()
            if (this.authorizationToken) { // no authorization token yet
                console.log("authenticating with token: " + this.authorizationToken);
                Token = this.authorizationToken;
                // have authorization token and can attempt to authenticate
                var accessRequest = new AccessRequest();
                accessRequest.makeRequest(xhr, this.baseurl, this.authorizationToken, username, password).then((token) => {
                    this.accessToken = token;
                    console.log("authenticated: received access token");
                    resolve();
                }).catch((reason) => {
                    reject(reason);
                });
            } else {
                console.log("Initialization failure: authentication token missing");
                reject();
            }
        });
    }
}

/*
 * Data services
 */
 class VariableGroup {
     constructor(baseurl, pathPrefix, variables) {
         this.baseurl = baseurl;
         if (pathPrefix) {
             this.pathPrefix = pathPrefix;
         }
         if (variables) {
             this.variables = variables;
         }
         this.uri = "_pxc_api/api/groups/";
         this.method = "POST";
         // variables and groups are protected resources. If authentication is enabled then a token must be presented with the request
         this.bearerToken;
     }
     // return a promise for registering a group
     makeRegisterGroup(xhr) {
         return new Promise((resolve, reject) => {
             xhr.open(this.method, this.baseurl + this.uri, true);
             xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
             if (this.bearerToken) {
                 xhr.setRequestHeader('Authorization', 'Bearer ' + this.bearerToken); // send access token
                 BearerToken = this.bearerToken;
             }
             xhr.onload = function onloadcallback() {
                 if (this.status === registerGroupSuccessStatus) {
                     console.log("Register group succeeded");
                     resolve(xhr.response);
                 } else {
                     console.log("Register group failed");
                     reject({
                         status: this.status,
                         statusText: this.statusText
                     });
                 }
             }
             xhr.send(this.makeRequestBody());
         });
     }
     makeRequestBody() {
         return JSON.stringify({ pathPrefix: this.pathPrefix, paths: this.variables});
     }
 }

class Api {
    constructor(baseurl)
    {
        this.baseurl = baseurl;
        // the current groups
        this.variableGroups = [];
    }
    loadAuth() {
        this.auth = new Auth2(baseurl);
        // initialize
        return this.auth.init();
    }
    // returns a promise for registering a group
    registerGroup(pathPrefix, variables) {
      return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            var groupObject = new VariableGroup(this.baseurl, pathPrefix, variables);
            if (this.auth && this.auth.accessToken) {
                console.log("setting token on register group request")
                groupObject.bearerToken = this.auth.accessToken;
            }
            groupObject.makeRegisterGroup(xhr).then(function registerGroupCallback(response) {
                console.log(response);
                var groupResponse = JSON.parse(response);
                // add to the list of groups
                var group = {id:  groupResponse.id, variablePathPrefix: groupResponse.variablePathPrefix, variables: groupResponse.variables};
                resolve(group); // return the newly created group object
            }).catch((status) => {
                console.log(status.text);
                reject(status);
            });
        });
    }
    getGroup(id) {
        console.log("Get group request");
        $.ajaxSetup({
          beforeSend: function(xhr) {
              xhr.setRequestHeader('Authorization', 'Bearer ' + BearerToken);
          }
        });
        $.ajax({
            type: "Get",
            url: baseurl+"_pxc_api/api/groups/"+id,
          })
          .done(function(data, status, jqXHR){
        console.log("Success group request");
        processGroupData(data)
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("ReadGroup Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
    alert( "ReadGroup $.ajax failed.  Status: " + status);
    });
}
}

function initialize(baseurl) {
    api = new Api(baseurl);
    return api;
}
function UpdateDateTime()
{
    var today = new Date();
    viewModel.dispDate(today.getDate() + "." + (today.getMonth() +1) + "." + today.getFullYear());
    var hours = today.getHours();
    var ampm = "AM";
    if (hours > 12) {
        hours = hours - 12;
        ampm = "PM";
    }
    viewModel.dispTime(hours + ":" + ("0" + today.getMinutes()).slice(-2) + ":" + ("0" + today.getSeconds()).slice(-2) + " " + ampm);
}
