// Initialize the array with some dummy values
var data = [{ TagPrefix: "Eclr", TagName: "dummytag", TagValue: "dummyvalue" }];
var root = "https://192.168.1.10"  // IP Adress of Controller
var SessionID ="";
var GroupID ="";

var varList = ["Integer1","Integer2","Boolean1","Boolean2","Real1","Real2","Array1[0]","Array1[1]","Struct1.Field1","Struct1.Field2"]
// This is the definition of our ViewModel class.
// ko will inspect this object and set up bindings with the HTML DOM when ko.applyBindings occurs
function AppViewModel() {
    var self = this;
    self.hmitags = ko.observableArray(data);
    self.VarName = ko.observable("Integer1");
    self.ConstantValue = ko.observable("2152");
    self.SourceVarName = ko.observable("Integer2");
    self.DestinationVarName = ko.observable("Boolean1");
    self.availableVariables = [ "Integer2",  "Boolean2",  "Real2",  "Array1[1]","Struct1.Field2"];
    self.AlertText = ko.observable();
    self.dispDate = ko.observable('Today');
    self.dispTime = ko.observable('99:99');
}
var viewModel = new AppViewModel();

$(document).ready(function () {
    ko.applyBindings(viewModel); // Activate knockout
    CreateSession()
    ReadGroup() // initial fetch
	  //RegisterGroup()
    window.setInterval(Read, 200); // update every second
    UpdateDateTime();
    setInterval(UpdateDateTime, 500);
});

function ReadVariable()//Function for reading out individual variables
{
  //List can contain only one variable
  var HMIReadList = "&paths=Integer1,Integer2,Boolean1,Boolean2,Real1,Real2,Array1[0],Array1[1],Struct1.Field1,Struct1.Field2"
  data.length = 0; // get rid of the data from the last query
    // issue the data request
    $.ajax({
      type: "GET",
      url: root+"/_pxc_api/api/variables?pathPrefix=Arp.Plc.Eclr/"+HMIReadList,
    }).done(function(data, status, jqXHR){
        successCallback(data);
        for(var i = 0; i < data.variables.length; i++)
        {
          //Split the prefix and name of the variable
          var prefix =""
          var name = data.variables[i].path
          if (name.indexOf("/") != -1)
          {
            var tmp =name.split("/");
            prefix = tmp[0];
            name = tmp[1];
          }
          // add it to the ko observable array named hmitags that is in the viewmodel
          viewModel.hmitags.push
          ({
            TagPrefix:   ko.observable(prefix),
            TagName:   ko.observable(name),
            TagValue:  ko.observable(data.variables[i].value)
          })
          }
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("CreateSession Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		    alert( "CreateSession $.ajax failed.  Status: " + status);
    });;
}

function Read()//Function for reading variable groups
{
  data.length=0;
  $.ajax({
    type: "GET",
    url: root+"/_pxc_api/api/groups/"+GroupID,
    })
    .done(function(data, status, jqXHR){
        successCallback(data);
        for(var i = 0; i < data.variables.length; i++)
        {
          // add it to the ko observable array named hmitags that is in the viewmodel
          viewModel.hmitags.push
          ({
            TagPrefix: ko.observable(data.variablePathPrefix),
            TagName:   ko.observable(data.variables[i].path),
            TagValue:  ko.observable(data.variables[i].value)
          })
          }
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("Read Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
    });
}

function Write()
{
	var writeData = {"sessionID": SessionID, "pathPrefix": "Arp.Plc.Eclr/", "variables": [ { "path": viewModel.VarName(), "value": viewModel.ConstantValue(), "valueType": "Constant" } ]};
	$.ajax({
    type: "PUT",
    url: root+"/_pxc_api/api/variables/",
	  data: JSON.stringify(writeData),
	  dataType: "json"
})
    .done(function(data, status, jqXHR){
        successCallback(data);
    })
    .fail(function(jqXHR, status, errorThrownthrown){
        console.log("Write Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		alert( "Write $.ajax failed.  Status: " + status);
    });
}

function CreateSession()
{
  $.ajax({
    type: "POST",
    data: "stationID=0",
    url: root+"/_pxc_api/api/sessions/",
    })
    .done(function(data, status, jqXHR){
        successCallback(data);
        //SessionID frome the JSON Response
        SessionID=data.sessionID;
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("CreateSession Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		    alert( "CreateSession $.ajax failed.  Status: " + status);
    });
}

function ReadGroup()
{
  $.ajax({
    type: "Get",
    url: root+"/_pxc_api/api/groups/",
})
    .done(function(data, status, jqXHR){
        successCallback(data);
        //console.log(data)
        GroupID=data.groups[0].id
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("ReadGroup Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
    alert( "ReadGroup $.ajax failed.  Status: " + status);
    });
}

function RegisterGroup()
{
  var writeData = { "sessionID": SessionID, "pathPrefix": "Arp.Plc.Eclr/", "paths": [ varList ] };
	$.ajax({
    type: "POST",
    data: JSON.stringify(writeData),
	  dataType: "json",
    url: root+"/_pxc_api/api/groups/",
})
    .done(function(data, status, jqXHR){
        successCallback(data);
        console.log(data)
        GroupID=data.id
    })
    .fail(function(jqXHR, status, errorThrown){
        console.log("RegisterGroup Error: " + errorThrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		alert( "RegisterGroup $.ajax failed.  Status: " + status);
    });
}

function successCallback(data)
{
    self.AlertText = "Success";
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
