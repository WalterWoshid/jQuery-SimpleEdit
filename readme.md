# jQuery SimpleEdit

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/donate?hosted_button_id=QLYGLC8FANLDJ)

SimpleEdit is a jQuery plugin for in-place editing.



## Dependencies
- jQuery >= 1.7



## Usage

### 1. Include it in your page.

```html
<link href="https://min.gitcdn.link/repo/WalterWoshid/jQuery-SimpleEdit/master/dist/jquery-simpleedit/css/jquery-simpleedit.min.css" rel="stylesheet">
<script src="https://min.gitcdn.link/repo/WalterWoshid/jQuery-SimpleEdit/master/dist/jquery-simpleedit/js/jquery-simpleedit.min.js"></script>
```

<span style="color:#FF8C00">Note to include jquery-simpleedit <u>after core library</u> (jquery)!</span>

### 2. Markup elements that should be editable. Usually it is an `<a>` element with additional `data-*` attributes.
```html
<a href="#" id="address" data-name="address" data-pk="1" data-url="/post">World Street 42</a>
```

|                | Main attributes you should define are:                                                |
| -------------- | ------------------------------------------------------------------------------------- |
| `id` or `name` | Name of field to be updated (column in db). Taken from `id` or `data-name` attribute. |
| `pk`           | Primary key of record to be updated (ID in db)                                        |
| `url`          | Url to server-side script to process submitted value                                  |

### 3. Apply simpleedit() method to your elements:
```js
$(document).ready(function () {
    $('#address').simpleedit()
})
```

You can also set the options **via javascript** like this:
```html
<a href="#" id="address">World Street 42</a>
```
```js
$('#address').simpleedit({
    pk: 1,
    url: '/post',
    name: 'address'
})
```

**Callback functions** are also supported:
```js
$('#address').simpleedit(function (changedText) {
    console.log(changedText)
})
```

**Use methods** in any order. The plugin will know what to use (error in console if not):
```js
$('#adress').simpleedit('/post', callback1, 'cancel', callback2)
```

### 4. Frontend ready!

Open your page and click on the element. Enter new value and submit form (Enter key or submit button). It will send ajax 
request with new value to `/post` (if url specified). Request contains `name`, `value` and `pk` of record to be updated:

```http request
POST /post
{
  name: 'address',    // Name of field (column in db)
  pk: 1,              // Primary key (record id)
  value: 'New adress' // New value
}
```

### 5. Write backend part: 

If you want to validate submitted value on server: 
- If value is <span style="color: #3cb371">valid</span>, you should return **HTTP status 200 OK**. Dom element will be 
  updated automatically.
- If value is <span style="color: #CD5C5C">not valid</span>, you should return **HTTP status != 200** or **HTTP status 
  200 with response `status: 'error'`**. Dom element will not be updated.
  
Default request method is POST, you can change it via defaults config:
```js
$.fn.simpleedit.defaults.ajaxOptions = { 
    type: 'PUT',
    // Additional jQuery ajax options
}
```
  
**JSON response:**

If your server returns JSON, you can send HTTP status 200 with error flag (`status: 'error'`) in response body. To process it use `success`
handler:
```js
// Example server reponse: 200 OK {status: 'error', msg: 'Field cannot be empty!'}
$('#address').simpleedit({
  // ...
  error: function(response) {
      console.log(response.msg)
  }
})
```



# Future plans:
- Include many types like in x-editable (abandoned): https://vitalets.github.io/x-editable/demo-bs3.html?c=inline
- Add Bootstrap 4-5, jQueryUi styles



# Donation
If you like this project, you can give me a cup of coffee :)
[![paypal](https://raw.githubusercontent.com/stefan-niedermann/paypal-donate-button/master/paypal-donate-button.png)](https://www.paypal.com/donate?hosted_button_id=QLYGLC8FANLDJ)
