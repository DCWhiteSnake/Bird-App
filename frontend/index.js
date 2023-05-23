greet = "";
x = fetch("http://localhost:8000/api/greet")
.then(response => response.json())
.then(data => alert(data['data']));