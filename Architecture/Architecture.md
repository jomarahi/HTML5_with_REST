## HTML5
The MVVM (Model-View-ViewModel) pattern provided by the free JavaScript library [Knockout.js](https://knockoutjs.com) is recommended as the implementation of the HTML page. Display and data are detached from each other and are connected only via a data binding mechanism. This makes it possible for requests to be sent to the server if necessary without the user noticing anything about them. Replies from the server are automatically evaluated and content of the website is automatically updated, so that a new construction process of the entire page is no longer necessary.

Design an HTML5 page. For the variable names and their values, you now need to create a binding object. 

```html
    <table id="variables">
		<thead>
			<tr>
				<th>Tag</th>
				<th>Value</th>
			</tr>
		</thead>
		<tbody data-bind="foreach:hmitags">
			<tr>
				<td id="Tag" data-bind="text: TagName"/>
				<td id="Value" data-bind="text: TagValue"/>
			</tr>
		</tbody>
	</table> 
```
![Project `Knockout.js](/Architecture/Knockoutjs.png)