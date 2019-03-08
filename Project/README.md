# User specific HTML5 using the PLCnext REST Interface

This example shows the external access to process data of the PLCnext Controller (AXC F 2152) via the REST API.
REST (REpresentational State Transfer) is a software architecture style consisting of guidelines and best practices for creating scalable web services.

## 1. PLCnext Engineer project
In the first step you have to create a project with the PLCnext Engineer. There you implement the program logic with the associated variables.
After the implementation has been completed, write and start the project to the controller.

! IMPORTANT !  
To read and write variables via the REST interface, they must be declared as `external`!

## 2. HTML5 
The next step is to create the HTML page. It is recommended to stick to the architectural pattern of Knockout.js.  
Read the [instruction](/Architecture/Architecture.md) how to implement the HTML page.  
The HTML code is attached to the project.  

----
## 3. REST Interface
The access of the REST client is via http methods to request or modify resources. The data exchange format is JSON.  
Implement the complete program logic in the viewmodel.  
API Documentation

The free [jQuery](https://jquery.com) JavaScript library provides an [ajax engine](api.jquery.com/jquery.ajax/) that simplifies the creation and call of a http method.  
Implement the http methods in the viewmodel.

The best way to read variables is to read variables in groups. The web server provides groups of variables that were requested at the beginning of the session. Since these groups are not persistent, the groups must be re-registered each time they are seated.  
In case of a GET method where the response from the server will come in JSON format, this JSON file still needs to be passed to the view (HTML). 

```javascript
function Read()// function for reading variable groups
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
```
The following example describes how to overwrite a single variable with a new value.
```javascript
function ReadVariable()// function for reading out individual variables
{
    // list can contain only one variable
    var HMIReadList = "&paths=Integer1"
    data.length = 0; // get rid of the data from the last query
    // issue the data request
    $.ajax({
        type: "GET",
        url: root+"/_pxc_api/api/variables?pathPrefix=Arp.Plc.Eclr/"+HMIReadList,
    })
    .done(function(data, status, jqXHR){
        successCallback(data);
        for(var i = 0; i < data.variables.length; i++)
        {
            // split the prefix and name of the variable
            var prefix =""
            var name = data.variables[i].path
            if (name.indexOf("/") != -1)
            {
                var tmp =name.split("/");
                prefix = tmp[0]+"/";
                name = tmp[1];
            }
            // add it to the ko observable array named hmitags that is in the viewmodel
            viewModel.hmitags.push
            ({
                TagPrefix: ko.observable(prefix),
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
```

The following example describes how to overwrite a single variable with a new value.

```javascript
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
        successCallback(data);
    })
    .fail(function(jqXHR, status, errorThrownthrown){
        console.log("Write Error: " + errorThrownthrown);
        console.log("Status: " + status);
        console.dir(jqXHR);
		alert( "Write $.ajax failed.  Status: " + status);
    });
}
```

To read IN-Ports and OUT-Ports use the following syntax: `Programinstancename.Outport`

----
## 4. Upload project files to controller

Once you've completed the HTML page with CSS stylesheet and JavaScript, you can transfer the associated files to the controller.

1. Write and start the PLCnext Engineer project "ExternalAccess.pcwex" to the controller

2. Upload the HTML5 data to the eHMI path

Use the SFTP protocol for downloading the files to the controller, e.g. by means of the open source software [WinSCP](https://winscp.net/).  
In WinSCP, first establish a connection to the controller: enter IP address, username and password.  
For the "admin" user, the default password is printed on the housing of the PLC.

In the `/Ehmi` directory create a subdirectory and copy all related files into it. 
For example:
```
/opt/plcnext/projects/PCWE/Services/Ehmi/HTML5
```

3. Launch the eHMI application and navigate to the external website

The website can now be accessed by any client connected to the controller by URL ("IP address of the controller"/"directory"/"documentname.html"). 
For example:
```
https://192.168.1.10/HTML5/HMIDemo.html
```

!!! This example works without User Authentification. Turn it off via the web-based management (WBM) on your controller.