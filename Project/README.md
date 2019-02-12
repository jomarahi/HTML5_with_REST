## User specific HTML5 using the PLCnext REST Interface

This example shows the external access to process data of the PLCnext Controller(AXC F 2152) via the REST API.
REST(REsprentational State Transfer) being a software architeture style consisting of guidelines and best practices for creating scalable web service.

## 1.PLCnextEngineer project
In the first step you have to create a project with the PLCnext Engineer. There you implement the program logic with the associated variables.
After the implementation has been completed write and start the project to the controller.

! IMPORTANT ! To read and write variables via the REST interface, they must be declared as external!

## 2. HTML5 
The next step is to create the HTML page. It is advisable to stick to the architectural pattern of Knockout.js. [Here](/Architecture/Architecture.md) is an explanation how the HTML page can be implemented.
The HTML code is attached to the project.

----
## REST API
The access of the REST client is via http methods to request or modify resources. The data exchange format is JSON. Please implement the complete program logic in the viewmodel.
API Documentation

### Implement the ViewModel
The free JavaScript library [jQuery](https://jquery.com) provides an [ajax engine](api.jquery.com/jquery.ajax/) that simplifies the creation and call of http method.

The best way to read variables is, to read variables in groups. The web server provides groups of variables that were requested at the beginning of the session. Since these groups are not persistent, the groups must be re-registered each time they are seated.
In the case of a GET methode, where the respone from the server come in JSON format, this JSON file still need to passed to the View(HTML). 

```JavaScript
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
```
The following example describes how to overwrite a single variable with a new value.
```JavaScript
function ReadVariable()//Function for reading out individual variables
{
    //List can contain only one variable
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
            //Split the prefix and name of the variable
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
```

The following example describes how to overwrite a single variable with a new value.
```JavaScript
function writeConstantToVariable()
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
```
To read IN ports and OUT ports write instead of the variable name (Name of program instance + (.) + IN / OUT port name)

----
## Upload project files to controller
Once you've completed the HTML page with style sheet and JavaScript, you can transfer the associated files to the controller.


1. Write and Start PLCnextEngineer project "ExternalAccess.pcwex" to the controller

2. Upload the HMTL5 folder to this path:   /opt/plcnext/projects/PCWE/Services/Ehmi/HTML5

To load the file onto the controller use SFTP. To do this, it is possible to use the open source software [WinSCP](https://winscp.net/). 
In WinSCP, it is first necessary to establish a connection to the controller. For this purpose, IP address, username and password. For the user admin, the default password is the one applied to the control case.

Please create a subfolder in the /ehmi-directory and copy all related files into the folder. 
For example:
```
/opt/plcnext/projects/PCWE/Ehmi/HTML5
```

3. Launch eHMI Application and navigate to External Webseite

The website can now be accessed by any client connected to the controller with the URL (IP address of the controller + path of the directory + documentname.html). 

For example:
```
https://192.168.1.10/HTML5/HMIDemo.html
```
!!!This example is without User Authentification